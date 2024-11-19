import express from 'express'
const router = express.Router()

let hotels = [
  { name: "Lavra Hotel", city: "Kyiv", startDate: "01.12.2024", endDate: "07.12.2024", price: "12"},
  { name: "Carpathian Hotel", city: "Lviv", startDate: "10.11.2024", endDate: "15.12.2024", price: "15"},
  { name: "Chernivtsi Hotel", city: "Chernivtsi", startDate: "05.01.2025", endDate: "10.01.2025", price: "10"}
]
router.post('/', (req, res) => {
  res.status(200).json(hotels);
})

router.post('/search', (req, res) => {
  const {city, startDate, endDate} = req.body;
  let result = hotels.filter((hotel) => hotel.city === city
  && hotel.startDate <= startDate
  && hotel.endDate >= endDate);
  res.status(200).json(result)
})

export default router;