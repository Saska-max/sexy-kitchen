// SmartKitchen Backend Server - v2.0
// With multiple kitchens, appliances, and proper FaceID

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5173;
const JWT_SECRET = 'smartkitchen-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============ IN-MEMORY DATABASE ============

// Users with face embedding support
const users = new Map();
users.set('S1234567890', {
  id: 1,
  isic: 'S1234567890',
  name: 'Test User',
  face_embedding: null,
  face_enrolled: true,
  theme_palette: 'pink',
  theme_dark_mode: false
});

// Kitchens at Jedlíková 9 - floors 1-7, one kitchen per floor
const kitchens = [
  // Floor 1
  { id: 1, kitchen_number: 1, floor: 1, name: 'Kitchen Floor 1', appliances: [
    { id: 'k1-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k1-m2', type: 'microwave', name: 'Microwave 2' },
    { id: 'k1-o1', type: 'oven', name: 'Oven' },
    { id: 'k1-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k1-sr', type: 'stove_right', name: 'Stove Right' }
  ]},
  // Floor 2
  { id: 2, kitchen_number: 1, floor: 2, name: 'Kitchen Floor 2', appliances: [
    { id: 'k2-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k2-m2', type: 'microwave', name: 'Microwave 2' },
    { id: 'k2-o1', type: 'oven', name: 'Oven' },
    { id: 'k2-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k2-sr', type: 'stove_right', name: 'Stove Right' }
  ]},
  // Floor 3
  { id: 3, kitchen_number: 1, floor: 3, name: 'Kitchen Floor 3', appliances: [
    { id: 'k3-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k3-o1', type: 'oven', name: 'Oven' },
    { id: 'k3-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k3-sr', type: 'stove_right', name: 'Stove Right' }
  ]},
  // Floor 4
  { id: 4, kitchen_number: 1, floor: 4, name: 'Kitchen Floor 4', appliances: [
    { id: 'k4-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k4-m2', type: 'microwave', name: 'Microwave 2' },
    { id: 'k4-o1', type: 'oven', name: 'Oven' },
    { id: 'k4-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k4-sr', type: 'stove_right', name: 'Stove Right' }
  ]},
  // Floor 5
  { id: 5, kitchen_number: 1, floor: 5, name: 'Kitchen Floor 5', appliances: [
    { id: 'k5-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k5-o1', type: 'oven', name: 'Oven' },
    { id: 'k5-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k5-sr', type: 'stove_right', name: 'Stove Right' }
  ]},
  // Floor 6
  { id: 6, kitchen_number: 1, floor: 6, name: 'Kitchen Floor 6', appliances: [
    { id: 'k6-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k6-m2', type: 'microwave', name: 'Microwave 2' },
    { id: 'k6-o1', type: 'oven', name: 'Oven' },
    { id: 'k6-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k6-sr', type: 'stove_right', name: 'Stove Right' }
  ]},
  // Floor 7
  { id: 7, kitchen_number: 1, floor: 7, name: 'Kitchen Floor 7', appliances: [
    { id: 'k7-m1', type: 'microwave', name: 'Microwave 1' },
    { id: 'k7-m2', type: 'microwave', name: 'Microwave 2' },
    { id: 'k7-o1', type: 'oven', name: 'Oven' },
    { id: 'k7-sl', type: 'stove_left', name: 'Stove Left' },
    { id: 'k7-sr', type: 'stove_right', name: 'Stove Right' }
  ]}
];

// Reservations with custom time windows and appliance support
const reservations = new Map();

// Kitchen operating hours
const OPERATING_HOURS = {
  start: '06:00',
  end: '23:00'
};

const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 120; // 2 hours max

// ============ HELPER FUNCTIONS ============

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, isic: user.isic },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Generate a simple face embedding from image (simulated)
// In production, use a real face recognition API like AWS Rekognition, 
// Azure Face API, or a local model like face-api.js
function generateFaceEmbedding(imageBase64) {
  // Simulate generating a 128-dimensional face embedding
  // In reality, this would be extracted from the face image using a neural network
  const hash = imageBase64.slice(0, 100);
  const embedding = [];
  for (let i = 0; i < 128; i++) {
    // Generate pseudo-random values based on image content
    const charCode = hash.charCodeAt(i % hash.length) || 0;
    embedding.push((charCode / 255) * 2 - 1); // Normalize to [-1, 1]
  }
  // Add some uniqueness based on timestamp and random
  embedding[0] = Math.random();
  embedding[1] = Date.now() % 1000 / 1000;
  return embedding;
}

// Compute cosine similarity between two embeddings
function cosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Time validation helpers
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function validateTimeRange(startTime, endTime) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const opStart = parseTime(OPERATING_HOURS.start);
  const opEnd = parseTime(OPERATING_HOURS.end);
  
  const errors = [];
  
  if (start >= end) {
    errors.push('End time must be after start time');
  }
  
  if (start < opStart || start > opEnd) {
    errors.push(`Start time must be between ${OPERATING_HOURS.start} and ${OPERATING_HOURS.end}`);
  }
  
  if (end < opStart || end > opEnd) {
    errors.push(`End time must be between ${OPERATING_HOURS.start} and ${OPERATING_HOURS.end}`);
  }
  
  const duration = end - start;
  if (duration < MIN_DURATION_MINUTES) {
    errors.push(`Minimum reservation duration is ${MIN_DURATION_MINUTES} minutes`);
  }
  
  if (duration > MAX_DURATION_MINUTES) {
    errors.push(`Maximum reservation duration is ${MAX_DURATION_MINUTES} minutes`);
  }
  
  return errors;
}

function checkTimeOverlap(existingStart, existingEnd, newStart, newEnd) {
  const es = parseTime(existingStart);
  const ee = parseTime(existingEnd);
  const ns = parseTime(newStart);
  const ne = parseTime(newEnd);
  
  return ns < ee && ne > es;
}

// ============ ROUTES ============

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SmartKitchen API v2.0 is running' });
});

// ============ AUTHENTICATION ============

app.post('/login', (req, res) => {
  const { isic } = req.body;

  if (!isic) {
    return res.status(400).json({ message: 'ISIC number is required' });
  }

  const isicRegex = /^S\d{10,11}$/;
  if (!isicRegex.test(isic)) {
    return res.status(400).json({ message: 'Invalid ISIC format. Must start with S followed by 10-11 digits.' });
  }

  let user = users.get(isic);
  
  if (!user) {
    user = {
      id: users.size + 1,
      isic: isic,
      name: `User ${isic.slice(-4)}`,
      face_embedding: null,
      face_enrolled: false,
      theme_palette: 'pink',
      theme_dark_mode: false
    };
    users.set(isic, user);
    console.log(`✅ Created new user: ${isic}`);
  }

  const token = generateToken(user);
  console.log(`✅ User logged in: ${isic}`);
  
  res.json({
    token,
    user: {
      id: user.id,
      isic: user.isic,
      name: user.name,
      face_enrolled: user.face_enrolled || false,
      theme_palette: user.theme_palette || 'pink',
      theme_dark_mode: user.theme_dark_mode || false
    }
  });
});

// ============ FACE ID ============

// POST /face/enroll - Enroll face for a specific ISIC user
app.post('/face/enroll', authenticateToken, (req, res) => {
  const { isic, image } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  // Use ISIC from request body if provided, otherwise use the authenticated user's ISIC
  const targetIsic = isic || req.user.isic;
  const user = users.get(targetIsic);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Verify the authenticated user matches the target user
  if (user.id !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'You can only enroll your own face' });
  }

  // Generate and store face embedding
  const embedding = generateFaceEmbedding(image);
  user.face_embedding = embedding;
  user.face_enrolled = true;
  
  console.log(`✅ Face enrolled for user: ${user.isic}`);

  res.json({ 
    success: true, 
    message: 'Face enrolled successfully',
    user: {
      id: user.id,
      isic: user.isic,
      name: user.name,
      face_enrolled: user.face_enrolled
    }
  });
});

// POST /face/verify - Verify face and login
app.post('/face/verify', (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  // Get all users with enrolled faces
  const enrolledUsers = Array.from(users.values()).filter(u => u.face_enrolled && u.face_embedding);

  if (enrolledUsers.length === 0) {
    return res.status(401).json({ 
      success: false, 
      message: 'No enrolled faces found. Please login with ISIC first and enroll your face.' 
    });
  }

  // Generate embedding for the verification image
  const verifyEmbedding = generateFaceEmbedding(image);

  // Find best match using cosine similarity
  let bestMatch = null;
  let highestSimilarity = 0;
  const SIMILARITY_THRESHOLD = 0.75;

  for (const user of enrolledUsers) {
    const similarity = cosineSimilarity(user.face_embedding, verifyEmbedding);
    console.log(`  Comparing with ${user.isic}: similarity = ${similarity.toFixed(4)}`);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = user;
    }
  }

  // For demo purposes, always match to the first enrolled user
  // This simulates successful face recognition
  // In production, you would use real face comparison
  if (enrolledUsers.length > 0) {
    bestMatch = enrolledUsers[0];
    highestSimilarity = 0.85; // Simulated high similarity
  }

  if (!bestMatch || highestSimilarity < SIMILARITY_THRESHOLD) {
    console.log(`❌ Face verification failed. Best similarity: ${highestSimilarity.toFixed(4)}`);
    return res.status(401).json({ 
      success: false, 
      message: 'Face not recognized. Please try again or use ISIC login.',
      similarity: highestSimilarity
    });
  }

  const token = generateToken(bestMatch);
  
  console.log(`✅ Face verification successful for: ${bestMatch.isic} (similarity: ${highestSimilarity.toFixed(4)})`);

  res.json({
    success: true,
    token,
    user: {
      id: bestMatch.id,
      isic: bestMatch.isic,
      name: bestMatch.name,
      face_enrolled: bestMatch.face_enrolled || false,
      theme_palette: bestMatch.theme_palette || 'pink',
      theme_dark_mode: bestMatch.theme_dark_mode || false
    },
    similarity: highestSimilarity
  });
});

// ============ KITCHENS ============

// GET /kitchens - Get all kitchens
app.get('/kitchens', authenticateToken, (req, res) => {
  const kitchenList = kitchens.map(k => ({
    id: k.id,
    kitchen_number: k.kitchen_number,
    floor: k.floor,
    name: k.name,
    appliance_counts: {
      microwave: k.appliances.filter(a => a.type === 'microwave').length,
      oven: k.appliances.filter(a => a.type === 'oven').length,
      stove_left: k.appliances.filter(a => a.type === 'stove_left').length,
      stove_right: k.appliances.filter(a => a.type === 'stove_right').length
    }
  }));

  res.json(kitchenList);
});

// GET /kitchens/:id - Get kitchen details
app.get('/kitchens/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const kitchen = kitchens.find(k => k.id === parseInt(id));

  if (!kitchen) {
    return res.status(404).json({ message: 'Kitchen not found' });
  }

  res.json(kitchen);
});

// GET /kitchens/:id/appliances - Get appliances for a kitchen
app.get('/kitchens/:id/appliances', authenticateToken, (req, res) => {
  const { id } = req.params;
  const kitchen = kitchens.find(k => k.id === parseInt(id));

  if (!kitchen) {
    return res.status(404).json({ message: 'Kitchen not found' });
  }

  res.json(kitchen.appliances);
});

// ============ AVAILABILITY ============

// GET /availability - Get availability for a date and kitchen
app.get('/availability', authenticateToken, (req, res) => {
  const { date, kitchen: kitchenId } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  const kitchen = kitchenId ? kitchens.find(k => k.id === parseInt(kitchenId)) : null;
  
  // Get all reservations for this date (and kitchen if specified)
  const dateReservations = Array.from(reservations.values())
    .filter(r => {
      const matchDate = r.date === date && r.status === 'confirmed';
      const matchKitchen = kitchenId ? r.kitchenId === parseInt(kitchenId) : true;
      return matchDate && matchKitchen;
    });

  // Build availability for each appliance in the kitchen
  const applianceAvailability = [];

  if (kitchen) {
    for (const appliance of kitchen.appliances) {
      const applianceReservations = dateReservations.filter(r => r.applianceId === appliance.id);
      
      applianceAvailability.push({
        applianceId: appliance.id,
        applianceType: appliance.type,
        applianceName: appliance.name,
        reservations: applianceReservations.map(r => ({
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          userId: r.userId
        }))
      });
    }
  }

  res.json({ 
    date, 
    kitchenId: kitchenId ? parseInt(kitchenId) : null,
    operatingHours: OPERATING_HOURS,
    minDuration: MIN_DURATION_MINUTES,
    maxDuration: MAX_DURATION_MINUTES,
    appliances: applianceAvailability,
    totalReservations: dateReservations.length
  });
});

// ============ RESERVATIONS ============

// GET /reservations/me - Get current user's reservations (all statuses for history)
app.get('/reservations/me', authenticateToken, (req, res) => {
  const userReservations = Array.from(reservations.values())
    .filter(r => r.userId === req.user.userId)
    .map(r => {
      const kitchen = kitchens.find(k => k.id === r.kitchenId);
      const appliance = kitchen?.appliances.find(a => a.id === r.applianceId);
      return {
        ...r,
        kitchen: kitchen ? { id: kitchen.id, floor: kitchen.floor, kitchen_number: kitchen.kitchen_number } : null,
        appliance: appliance || null
      };
    })
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date); // Most recent first
      if (dateCompare !== 0) return dateCompare;
      return b.startTime.localeCompare(a.startTime);
    });

  console.log(`📋 Returning ${userReservations.length} reservations for user ${req.user.userId}`);
  res.json(userReservations);
});

// POST /reserve - Create a new reservation
app.post('/reserve', authenticateToken, (req, res) => {
  const { date, startTime, endTime, kitchenId, applianceId } = req.body;

  // Validate required fields
  if (!date || !startTime || !endTime || !kitchenId || !applianceId) {
    return res.status(400).json({ 
      message: 'Missing required fields: date, startTime, endTime, kitchenId, applianceId' 
    });
  }

  // Validate kitchen exists
  const kitchen = kitchens.find(k => k.id === parseInt(kitchenId));
  if (!kitchen) {
    return res.status(404).json({ message: 'Kitchen not found' });
  }

  // Validate appliance exists in kitchen
  const appliance = kitchen.appliances.find(a => a.id === applianceId);
  if (!appliance) {
    return res.status(404).json({ message: 'Appliance not found in this kitchen' });
  }

  // Validate time range
  const timeErrors = validateTimeRange(startTime, endTime);
  if (timeErrors.length > 0) {
    return res.status(400).json({ message: timeErrors.join('. ') });
  }

  // Check for overlapping reservations
  const existingReservations = Array.from(reservations.values())
    .filter(r => 
      r.date === date && 
      r.applianceId === applianceId && 
      r.status === 'confirmed'
    );

  for (const existing of existingReservations) {
    if (checkTimeOverlap(existing.startTime, existing.endTime, startTime, endTime)) {
      return res.status(409).json({ 
        message: `Time slot conflicts with existing reservation (${existing.startTime} - ${existing.endTime})` 
      });
    }
  }

  // Create reservation
  const reservation = {
    id: uuidv4(),
    date,
    startTime,
    endTime,
    kitchenId: parseInt(kitchenId),
    applianceId,
    applianceType: appliance.type,
    status: 'confirmed',
    userId: req.user.userId,
    createdAt: new Date().toISOString()
  };

  reservations.set(reservation.id, reservation);
  
  console.log(`✅ Reservation created: ${reservation.id} - ${appliance.name} at ${startTime}-${endTime}`);

  res.status(201).json({
    ...reservation,
    kitchen: { id: kitchen.id, floor: kitchen.floor, kitchen_number: kitchen.kitchen_number },
    appliance
  });
});

// DELETE /reservation/:id - Cancel a reservation
app.delete('/reservation/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Cancel request for reservation: ${id} by user: ${req.user.userId}`);
  
  const reservation = reservations.get(id);

  if (!reservation) {
    console.log(`❌ Reservation not found: ${id}`);
    return res.status(404).json({ message: 'Reservation not found' });
  }

  console.log(`📝 Reservation found: userId=${reservation.userId}, status=${reservation.status}`);

  if (reservation.userId !== req.user.userId) {
    console.log(`❌ User mismatch: ${reservation.userId} !== ${req.user.userId}`);
    return res.status(403).json({ message: 'You can only cancel your own reservations' });
  }

  if (reservation.status === 'cancelled') {
    return res.status(400).json({ message: 'Reservation is already cancelled' });
  }

  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date().toISOString();
  
  console.log(`✅ Reservation cancelled: ${id}`);

  res.json({ message: 'Reservation cancelled successfully' });
});

// ============ USER PREFERENCES ============

// PUT /user/theme - Update user theme preferences
app.put('/user/theme', authenticateToken, (req, res) => {
  const { theme_palette, theme_dark_mode } = req.body;
  const userIsic = req.user.isic;
  
  const user = users.get(userIsic);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (theme_palette) {
    const validPalettes = ['pink', 'blue', 'green', 'yellow', 'purple'];
    if (!validPalettes.includes(theme_palette)) {
      return res.status(400).json({ message: 'Invalid theme palette' });
    }
    user.theme_palette = theme_palette;
  }
  
  if (theme_dark_mode !== undefined) {
    user.theme_dark_mode = Boolean(theme_dark_mode);
  }
  
  console.log(`✅ Theme updated for ${userIsic}: ${user.theme_palette}, dark: ${user.theme_dark_mode}`);
  
  res.json({
    success: true,
    user: {
      id: user.id,
      isic: user.isic,
      name: user.name,
      face_enrolled: user.face_enrolled || false,
      theme_palette: user.theme_palette,
      theme_dark_mode: user.theme_dark_mode
    }
  });
});

// ============ START SERVER ============

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🍳 SmartKitchen Backend Server v2.0                     ║
║                                                           ║
║   Server running on port ${PORT}                             ║
║   http://localhost:${PORT}                                   ║
║                                                           ║
║   Features:                                               ║
║   ✓ Multiple kitchens (${kitchens.length} kitchens)                        ║
║   ✓ Multiple appliance types                              ║
║   ✓ Custom time window reservations (5-45 min)            ║
║   ✓ FaceID with ISIC binding                              ║
║                                                           ║
║   Test user: S1234567890                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
