import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { getConnection } from '../mongodb.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const database = getConnection();
  const hotelCollection = database.collection('hotels');
  const hotels = await hotelCollection.find({}).toArray()
  res.status(200).json(hotels);
})

const roomFilter = (room, start, end) => {
  const afterStart = new Date(room.startDate) <= start;
  const beforeEnd = new Date(room.endDate) >= end;
  return afterStart && beforeEnd
}

const hotelFilter = (hotel, city, start, end) => {
  const rooms = hotel.rooms
  return rooms.filter((room) => roomFilter(room, start, end)).length && (hotel.city === city)
}

router.post('/search', async (req, res) => {
  const { city, startDate, endDate } = req.body
  const start = new Date(startDate)
  const end = new Date(endDate)

  const database = getConnection()
  const hotelCollection = database.collection('hotels');

  const hotels = await hotelCollection.find({}).toArray()
  const result = hotels.filter((hotel) => hotelFilter(hotel, city, start, end))
  if (result) {
    return res.status(200).json(result)
  } else {
    return res.status(404).json({ message: "No hotels with at least one room it this date interval" })
  }
})


router.post('/:id/rooms', async (req, res) => {
  const { id } = req.params
  const { startDate, endDate } = req.body

  const idInt = parseInt(id);
  const start = new Date(startDate)
  const end = new Date(endDate)

  const database = getConnection();
  const hotelCollection = database.collection('hotels');

  const resultHotel = await hotelCollection.findOne({ id: idInt });
  if (resultHotel) {
    const roomList = resultHotel.rooms.filter((room) => roomFilter(room, start, end))
    if (roomList) {
      return res.status(200).json(roomList)
    } else {
      return res.status(404).json({ message: "no aviable rooms" })
    }
  } else {
    return res.status(404).json({ message: "Hotel not found" })
  }
})



//book room with id roomId in hotel with id hotelId
router.patch('/:hotelId/rooms/:roomId/book', authMiddleware, async (req, res) => {
    let {hotelId, roomId} = req.params
    const hotelIdInt = parseInt(hotelId);
    const roomIdInt = parseInt(roomId);

    const database = getConnection();
    const hotelCollection = database.collection('hotels');

    const hotel = await hotelCollection.findOne({ id: hotelIdInt });
    if (!hotel) {
        return res.status(404).json({ message: `Hotel with id ${hotelId} not found` });
    }
    const room = await hotelCollection.findOne({ 
      id:hotelIdInt,
      'rooms.id' : roomIdInt 
    });
    if (!room) {
        return res.status(404).json({ message: `Room with id ${roomId} not found` });
    }
    if (room.status === 'booked') {
        return res.status(400).json({ message: "Room is already booked" });
    }
    const updateResult = await hotelCollection.updateOne(
      { id: hotelIdInt, 'rooms.id': roomIdInt },
      {
        $set: {
          'rooms.$.status' : "booked",
          'rooms.$.customer': req.user.username
        }
      }
    );
    if(updateResult.modifiedCount === 0){
      return res.status(500).json({ message: "Failed to book the room" });
    }
    return res.status(200).json({
        message: `Room with id ${roomId} in hotel with id ${hotelId} successfully booked`
    });
});

//unbook room with id roomId in hotel with id hotelId
router.patch('/:hotelId/rooms/:roomId/unbook', authMiddleware, async (req, res) => {
  let {hotelId, roomId} = req.params
  const hotelIdInt = parseInt(hotelId);
  const roomIdInt = parseInt(roomId);

  const database = getConnection();
  const hotelCollection = database.collection('hotels');

  const hotel = await hotelCollection.findOne({ id: hotelIdInt });
  if (!hotel) {
      return res.status(404).json({ message: `Hotel with id ${hotelId} not found` });
  }
  const room = await hotelCollection.findOne({ 
    id:hotelIdInt,
    'rooms.id' : roomIdInt 
  });
  if (!room) {
      return res.status(404).json({ message: `Room with id ${roomId} not found` });
  }
  if (room.status === 'available') {
      return res.status(400).json({ message: "Room is already available" });
  }
  const updateResult = await hotelCollection.updateOne(
    { id: hotelIdInt, 'rooms.id': roomIdInt },
    {
      $set: {
        'rooms.$.status' : "available",
        'rooms.$.customer': ""
      }
    }
  );
  if(updateResult.modifiedCount === 0){
    return res.status(500).json({ message: "Failed to unbook the room" });
  }
  return res.status(200).json({
      message: `Room with id ${roomId} in hotel with id ${hotelId} successfully unbooked`
  });
});

//find all rooms with customer = current user
router.get('/bookings', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username; 
    const userBookings = [];

    const database = getConnection();
    const hotelCollection = database.collection('hotels');

    const hotels = await hotelCollection.find({ 'rooms.customer': username }).toArray();

    hotels.forEach(hotel => {
      hotel.rooms.forEach(room => {
        if (room.customer === username) {
          userBookings.push({
            hotelId: hotel.id,
            hotelName: hotel.name,
            city: hotel.city,
            room: {
              id: room.id,
              type: room.type,
              status: room.status,
              bedsCount: room.bedsCount,
              price: room.price,
              startDate: room.startDate,
              endDate: room.endDate,
              image: room.image,
            },
          });
        }
      });
    });

    res.status(200).json(userBookings);

  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});


export default router;