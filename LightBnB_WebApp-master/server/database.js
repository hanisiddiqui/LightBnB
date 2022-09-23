const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return pool

    .query(
      `SELECT * FROM users WHERE users.email = $1;`,
      [ email ])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return NULL;
    });
  
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool

  .query(
    `SELECT users.name FROM users WHERE users.id = $1;`,
    [ id ])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool

    .query(
      `INSERT INTO users (name, email, password) 
      VALUES ($1, $2, $3);`,
      [ user.name, user.email, user.password ])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query(
    `SELECT reservations.*, properties.*, property_reviews.*
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id, property_reviews.id
    ORDER BY reservations.start_date
    LIMIT $2;`,
    [ guest_id, limit ])
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
   // 1
   const queryParams = [];
   // 2
   let queryString = `
   SELECT properties.*, avg(property_reviews.rating) as average_rating
   FROM properties
   JOIN property_reviews ON properties.id = property_id
   `;
 
   // 3
   if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $1 `;
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $2;
    `;
   } else if (options.owner_id){
    queryParams.push(`${options.owner_id}`);
    queryString += `WHERE owner_id LIKE $1 `;
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $2;
    `;
   } else if (options.minimum_price_per_night && options.maximum_price_per_night){
    queryParams.push(`${options.minimum_price_per_night}`*100);
    queryParams.push(`${options.maximum_price_per_night}`*100);
    queryString += `WHERE cost_per_night >= $1 AND cost_per_night <= $2 `;
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $3;
    `;
   } else if (options.minimum_rating){
    queryParams.push(`${options.minimum_rating}`);
    queryString += `WHERE rating >= $1 `;
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $2;
    `;
   } else {
    // 4
     queryParams.push(limit);
     queryString += `
     GROUP BY properties.id
     ORDER BY cost_per_night
     LIMIT $1;
    `;
   }
 
 
 
   // 5
   console.log(queryString, queryParams);
 
   // 6
   return pool.query(queryString, queryParams).then((res) => res.rows);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
