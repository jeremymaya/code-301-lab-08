'use strict';

// server setup
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/events', getEvents);

function getLocation(request, response) {
  const searchQuery = request.query.data;
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;

  superagent.get(URL)
    .then(superagentResults => {
      const locationData = superagentResults.body.results[0];
      const location = new Location(searchQuery, locationData);
      response.status(200).send(location);
    })
    .catch(error => {
      handleError(error, response);
    })
}

function Location(searchQuery, locationData){
  this.search_query = searchQuery;
  this.formatted_query = locationData.formatted_address;
  this.latitude = locationData.geometry.location.lat;
  this.longitude = locationData.geometry.location.lng;
}

function getWeather(request, response) {
  const searchQuery = request.query.data;
  const latitude = searchQuery.latitude;
  const longitude = searchQuery.longitude;
  const URL = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latitude},${longitude}`;

  superagent.get(URL)
    .then(superagentResults => {
      const weatherData = superagentResults.body.daily.data;
      const weatherForecast = weatherData.map(obj => {
        return new Weather(obj);
      })
      response.status(200).send(weatherForecast);
    })
    .catch(error => {
      handleError(error, response);
    })
}

function Weather(obj){
  this.forecast = obj.summary;
  this.time = this.formattedDate(obj.time);
}

Weather.prototype.formattedDate = function(time) {
  const date = new Date(time*1000);
  return date.toDateString();
}

function getEvents(request, response) {
  const searchQuery = request.query.data;
  const latitude = searchQuery.latitude;
  const longitude = searchQuery.longitude;
  const URL = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${longitude}&location.latitude=${latitude}&expand=venue&token=${process.env.EVENTBRITE_API_KEY}`;

  superagent.get(URL)
    .then(superagentResults => {
      let eventData = superagentResults.body.events;
      const eventSchedule = eventData.map(obj => {
        return new Event(obj);
      })
      response.status(200).send(eventSchedule);
    })
    .catch(error => {
      handleError(error, response);
    })
}

function Event(obj){
  this.link = obj.url;
  this.name = obj.name.text;
  this.event_date = obj.start.local;
  this.summary = obj.summary;
}

function handleError(error, response){
  const errorObj = {
    status: 500,
    text: 'Sorry, something went wrong (Error: 500)'
  }
  response.status(error.status).send(errorObj);
}

app.listen(PORT, () => console.log(`listening on ${PORT}`));
