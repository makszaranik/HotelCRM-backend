import mysql from 'mysql'

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'admin',
  password: 'admin',
  database: 'HotelBookingSystem'
})

export default connection