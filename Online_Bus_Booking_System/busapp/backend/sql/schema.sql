-- Amani Bus Booking System — MySQL Schema
-- Matches the ER diagram: Users, Buses, Routes, Trips, Seats, Bookings, Payments, Drivers, Operators

CREATE DATABASE IF NOT EXISTS amani_bus_booking CHARACTER SET utf8mb4;
USE amani_bus_booking;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin','driver') DEFAULT 'user',
  status ENUM('active','suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE operators (
  operator_id INT AUTO_INCREMENT PRIMARY KEY,
  operator_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  address VARCHAR(255),
  status ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE buses (
  bus_id INT AUTO_INCREMENT PRIMARY KEY,
  bus_name VARCHAR(120) NOT NULL,
  plate_number VARCHAR(30) UNIQUE,
  bus_type ENUM('VIP','Ordinary') DEFAULT 'Ordinary',
  capacity INT DEFAULT 40,
  operator_id INT,
  status ENUM('active','maintenance','inactive') DEFAULT 'active',
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);

CREATE TABLE drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  bus_id INT,
  status ENUM('active','inactive') DEFAULT 'active',
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id)
);

CREATE TABLE routes (
  route_id INT AUTO_INCREMENT PRIMARY KEY,
  from_location VARCHAR(80) NOT NULL,
  to_location VARCHAR(80) NOT NULL,
  distance_km INT,
  estimated_time DECIMAL(4,1),
  status ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE trips (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT NOT NULL,
  route_id INT NOT NULL,
  departure_datetime DATETIME NOT NULL,
  arrival_datetime DATETIME NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL,
  available_seats INT DEFAULT 40,
  status ENUM('scheduled','departed','completed','cancelled') DEFAULT 'scheduled',
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
  FOREIGN KEY (route_id) REFERENCES routes(route_id)
);

CREATE TABLE seats (
  seat_id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT NOT NULL,
  seat_number INT NOT NULL,
  seat_type ENUM('ordinary','vip') DEFAULT 'ordinary',
  status ENUM('available','booked') DEFAULT 'available',
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
  UNIQUE KEY uniq_bus_seat (bus_id, seat_number)
);

CREATE TABLE bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  seat_id INT NOT NULL,
  booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_fare DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
  payment_ref VARCHAR(60),
  ticket_code VARCHAR(20) UNIQUE,
  sms_sent TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);

CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('mpesa','tigopesa','airtelmoney','card') NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status ENUM('pending','success','failed') DEFAULT 'pending',
  transaction_ref VARCHAR(80),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- Seed data: bus companies
INSERT INTO operators (operator_name, phone, email, address) VALUES
('Amani Safaris','+255700000001','info@amanisafaris.co.tz','Arusha'),
('Blandina Safaris','+255700000002','info@blandinasafaris.co.tz','Dar es Salaam'),
('Brian Safaris','+255700000003','info@briansafaris.co.tz','Mbeya'),
('Happynes Safaris','+255700000004','info@happynessafaris.co.tz','Geita'),
('Machemba Safaris','+255700000005','info@machembasafaris.co.tz','Kahama');

INSERT INTO buses (bus_name, plate_number, bus_type, capacity, operator_id) VALUES
('Amani Safaris VIP','T123ABC','VIP',40,1),
('Blandina Safaris Ordinary','T124ABC','Ordinary',40,2),
('Brian Safaris VIP','T125ABC','VIP',40,3),
('Happynes Safaris Ordinary','T126ABC','Ordinary',40,4),
('Machemba Safaris VIP','T127ABC','VIP',40,5);

INSERT INTO routes (from_location, to_location, distance_km, estimated_time) VALUES
('Arusha','Dar es Salaam',640,9.0),
('Dar es Salaam','Arusha',640,9.0),
('Arusha','Mbeya',830,12.0),
('Mbeya','Arusha',830,12.0),
('Geita','Kahama',120,2.5),
('Kahama','Geita',120,2.5),
('Arusha','Geita',560,8.0),
('Geita','Arusha',560,8.0),
('Dar es Salaam','Mbeya',710,10.0),
('Mbeya','Dar es Salaam',710,10.0);
