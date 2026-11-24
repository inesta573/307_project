CREATE DATABASE IF NOT EXISTS db;
USE db;

CREATE TABLE IF NOT EXISTS members (
  email varchar(255) NOT NULL,
  pin varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS tickets (
  ticket varchar(64) NOT NULL,
  member_email varchar(255) NOT NULL,
  PRIMARY KEY (ticket)
);
