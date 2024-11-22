import express from 'express'
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
            "endDate":"07.12.2024"
         },
         {
            "id":2,
            "type":"double",
            "status":"booked",
            "bedsCount":2,
            "price":12,
            "startDate":"01.12.2024",
            "endDate":"07.12.2024"
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
            "endDate":"15.12.2024"
         },
         {
            "id":2,
            "type":"double",
            "status":"booked",
            "bedsCount":2,
            "price":15,
            "startDate":"10.11.2024",
            "endDate":"15.12.2024"
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
            "endDate":"10.01.2025"
         },
         {
            "id":2,
            "type":"double",
            "status":"booked",
            "bedsCount":2,
            "price":10,
            "startDate":"05.01.2025",
            "endDate":"10.01.2025"
         }
      ]
   }
]

router.get('/all', (req, res) => {
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



router.post('/bookroom', (req, res) => {

})

export default router;