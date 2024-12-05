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

//create a new hotel
router.post('/new', async (req, res) => {
  try {
    const { name, city, image } = req.body;
    if (!name || !city || !image) {
      return res.status(400).json({ message: 'Name and city and image required' });
    }

    const database = getConnection();
    const hotelCollection = database.collection('hotels');

    const lastHotel = await hotelCollection.find().sort({ id: -1 }).limit(1).toArray();
    const newId = lastHotel.length > 0 ? lastHotel[0].id + 1 : 1;

    const newHotel = {
      id: newId,
      name,
      city,
      image,
      rooms: [],
    };

    await hotelCollection.insertOne(newHotel);
    res.status(201).json(newHotel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server internal error' });
  }
});


//delete hotel with id = "id"
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const database = getConnection();
    const hotelCollection = database.collection('hotels');

    const result = await hotelCollection.deleteOne({ id });
    if (result.deletedCount === 1) { 
      res.status(200).json({ message: 'Hetel successfully deleted' });
    } else {
      res.status(404).json({ message: 'Hotel not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server internal error' });
  }
});

//add new room to hotel with id = "id"
router.post('/:hotelId/rooms/add', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { type, bedsCount, price, image, startDate, endDate, status } = req.body;

    if (!type || bedsCount === undefined || price === undefined || !image || !startDate || !endDate || !status) {
      return res.status(400).json({ message: "All fields are required" });
    }
    

    const database = getConnection();
    const hotelCollection = database.collection('hotels');

    const hotel = await hotelCollection.findOne({ id: parseInt(hotelId) });
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const newRoomId = hotel.rooms.length > 0 ? hotel.rooms[hotel.rooms.length - 1].id + 1 : 1;

    const newRoom = {
      id: newRoomId,
      type,
      bedsCount,
      price,
      image,
      startDate,
      endDate,
      status,
    };

    await hotelCollection.updateOne(
      { id: parseInt(hotelId) },
      { $push: { rooms: newRoom } }
    );

    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


//delete room with id = "id" from hotel with id = "id"
router.delete('/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const hotelId = parseInt(req.params.hotelId);
    const roomId = parseInt(req.params.roomId);

    const database = getConnection();
    const hotelCollection = database.collection('hotels');

    const updateResult = await hotelCollection.updateOne(
      { id: hotelId },
      { $pull: { rooms: { id: roomId } } }
    );

    if (updateResult.modifiedCount === 1) {
      res.status(200).json({ message: 'Room successfully deleted' });
    } else {
      res.status(404).json({ message: 'Hotel or room not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server internal error' });
  }
});



export default router;