import express from 'express'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()


const hotels = [
   {
      "id":1,
      "name":"Lavra Hotel",
      "city":"Kyiv",
      "image":"https://irecommend.ru/sites/default/files/imagecache/copyright1/user-images/254382/Td7dzleRwxXcF9Vr1K6Og.jpg",
      "rooms":[
         {
            "id":1,
            "type":"single",
            "status":"available",
            "bedsCount":1,
            "price":12,
            "startDate":"01.12.2024",
            "endDate":"07.12.2024",
            "customer":"",
            "image":"https://content.skyscnr.com/available/1647052546/1647052546_960x576.jpg"
         },
         {
            "id":2,
            "type":"double",
            "status":"available",
            "bedsCount":2,
            "price":12,
            "startDate":"01.12.2024",
            "endDate":"07.12.2024",
            "customer":"",
            "image":"https://content.skyscnr.com/available/1647052546/1647052546_960x576.jpg"
         }
      ]
   },
   {
      "id":2,
      "name":"Carpathian Hotel",
      "city":"Lviv",
      "image":"https://starapravda.com.ua/wp-content/uploads/2021/06/054febd547ca10e0b542408ee239fb39-1024x684.jpg",
      "rooms":[
         {
            "id":1,
            "type":"single",
            "status":"available",
            "bedsCount":1,
            "price":15,
            "startDate":"10.11.2024",
            "endDate":"15.12.2024",
            "customer":""
         },
         {
            "id":2,
            "type":"double",
            "status":"booked",
            "bedsCount":2,
            "price":15,
            "startDate":"10.11.2024",
            "endDate":"15.12.2024",
            "customer":""
         }
      ]
   },
   {
      "id":3,
      "name":"Chernivtsi Hotel",
      "city":"Chernivtsi",
      "image":"https://starapravda.com.ua/wp-content/uploads/2021/06/054febd547ca10e0b542408ee239fb39-1024x684.jpg",
      "rooms":[
         {
            "id":1,
            "type":"single",
            "status":"available",
            "bedsCount":1,
            "price":10,
            "startDate":"05.01.2025",
            "endDate":"10.01.2025",
            "customer":""
         },
         {
            "id":2,
            "type":"double",
            "status":"booked",
            "bedsCount":2,
            "price":10,
            "startDate":"05.01.2025",
            "endDate":"10.01.2025",
            "customer":""
         }
      ]
   }
]

router.get('/', (req, res) => {
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

router.post('/search', (req, res) => {
  const { city, startDate, endDate } = req.body
  const start = new Date(startDate)
  const end = new Date(endDate)
  const result = hotels.filter((hotel) => hotelFilter(hotel, city, start, end))
  if (result) {
    return res.status(200).json(result)
  } else {
    return res.status(404).json({ message: "No hotels with at least one room it this date interval" })
  }
})


router.post('/:id/rooms', (req, res) => {
  const { id } = req.params
  const { startDate, endDate } = req.body
  const start = new Date(startDate)
  const end = new Date(endDate)

  const resultHotel = hotels.find((hotel) => hotel.id === parseInt(id))
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



router.patch('/:hotelId/rooms/:roomId/book', authMiddleware, async (req, res) => {
   const {hotelId, roomId} = req.params
   const hotel = hotels.find((hotel) => hotel.id === parseInt(hotelId));
   if (!hotel) {
      return res.status(404).json({ message: `Hotel with id ${hotelId} not found` });
   }
   const room = hotel.rooms.find((room) => room.id === parseInt(roomId));
   if (!room) {
      return res.status(404).json({ message: `Room with id ${roomId} not found` });
   }
   if (room.status === 'booked') {
      return res.status(400).json({ message: "Room is already booked" });
   }
   room.status = 'booked';
   room.customer = req.user.username;
   return res.status(200).json({
      message: `Room with id ${roomId} in hotel with id ${hotelId} successfully booked`
   });
});


router.patch('/:hotelId/rooms/:roomId/unbook', authMiddleware, async (req, res) => {
   const { hotelId, roomId } = req.params;
   const hotel = hotels.find((hotel) => hotel.id === parseInt(hotelId));
   if (!hotel) {
      return res.status(404).json({ message: `Hotel with id ${hotelId} not found` });
   }
   const room = hotel.rooms.find((room) => room.id === parseInt(roomId));
   if (!room) {
      return res.status(404).json({ message: `Room with id ${roomId} not found` });
   }
   if (room.status !== 'booked' || room.customer !== req.user.username) {
      return res.status(400).json({ message: "You cannot unbook this room" });
   }
   room.status = 'available';
   room.customer = '';
   return res.status(200).json({
      message: `Room with id ${roomId} in hotel with id ${hotelId} successfully unbooked`
   });
});

router.get('/bookings', authMiddleware, async (req, res) => {
   const username = req.user.username; 
   const userBookings = [];

   hotels.forEach(hotel => {
     hotel.rooms.forEach(room => {
       if (room.customer === username) {
         userBookings.push({
           hotelId: hotel.id,
           hotelName: hotel.name,
           city: hotel.city,
           room: room,
         });
       }
     });
   });
 
   res.status(200).json(userBookings);
 });

export default router;