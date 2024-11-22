import express from 'express'
const router = express.Router()

const hotels = [
  {id: 1, name: "Lavra Hotel", city: "Kyiv", rooms: [{id: 1, type: "single", status: "aviable", bedsCount: 1, price: "12", startDate: "01.12.2024", endDate: "07.12.2024"}, {id: 2, type: "double", status: "booked", bedsCount: 2, price: "12", startDate: "01.12.2024", endDate: "07.12.2024"}]},
  {id: 2, name: "Carpathian Hotel", city: "Lviv", rooms: [{id: 1, type: "single", status: "aviable", bedsCount: 1, price: "15", startDate: "10.11.2024", endDate: "15.12.2024"}, {id: 2, type: "double", status: "booked", bedsCount: 2, price: "15", startDate: "10.11.2024", endDate: "15.12.2024"}]},
  {id: 3, name: "Chernivtsi Hotel", city: "Chernivtsi", rooms: [{id: 1, type: "single", status: "aviable", bedsCount: 1, price: "10", startDate: "05.01.2025", endDate: "10.01.2025"}, {id: 2, type: "double", status: "booked", bedsCount: 2, price: "10", startDate: "05.01.2025", endDate: "10.01.2025"}]}
];

router.get('/all', (req, res) => {
  res.status(200).json(hotels);
})

const RoomFilter = (room, start, end) => {
  const afterStart = new Date(room.startDate) <= start;
  const beforeEnd = new Date(room.endDate) >= end;
  return afterStart && beforeEnd
}

const HotelFilter = (hotel, city, start, end) => {
  const rooms = hotel.rooms
  return rooms.filter((room) => RoomFilter(room, start, end)).length && (hotel.city === city)
}

router.post('/search', (req, res) => {
  const {city, startDate, endDate} = req.body
  const start = new Date(startDate)
  const end = new Date(endDate)
  const result = hotels.filter((hotel) => HotelFilter(hotel, city, start, end))
  if(result){
    return res.status(200).json(result)
  }else{
    return res.status(404).json({message: "No hotels with at least one room it this date interval"})
  }
})


router.post('/:id/rooms', (req, res) => {
  const {id} = req.params
  const {startDate, endDate} = req.body
  const start = new Date(startDate)
  const end = new Date(endDate)

  const resultHotel = hotels.find((hotel) => hotel.id === parseInt(id))
  if(resultHotel){
    const roomList = resultHotel.rooms.filter((room) => RoomFilter(room, start, end))
    if(roomList){
      return res.status(200).json(roomList)
    }else{
      return res.status(404).json({message: "no aviable rooms"})
    }
  }else{
    return res.status(404).json({message: "Hotel not found"})
  }
})



router.post('/bookroom', (req, res) => {

})

export default router;