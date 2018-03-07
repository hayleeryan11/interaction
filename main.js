var socket = io.connect("http://24.16.255.56:8888");

socket.on("load", function (data) {
  var i = 0;
    for (;i < gameEngine.entities.length; i++) {
      gameEngine.entities[i].removeFromWorld = true;
    }
    var json = JSON.parse(data.data);
    var count = 0;
    json.forEach(function(boid) {

      var temp = new Boid(gameEngine, boid.x, boid.y);
      temp.velocity = new Vector(boid.velocity.x, boid.velocity.y);
      temp.location =  new Vector(boid.location.x, boid.location.y);
      temp.acceleration =  new Vector(0, 0);
      temp.r = 15;
      temp.maxSpeed = 5;
      temp.maxForce = 0.03;
      temp.game = gameEngine;
      console.log(boid.x);
      gameEngine.addEntity(temp);
    });
});

function save(){
  var boids = [];
  ents = JSON.stringify(gameEngine.entities,
    function(key, value) {
      if (typeof value === 'object' && value !== null) {
          if (boids.indexOf(value) !== -1) {
              return;
          }
          boids.push(value);
      }
      return value;
    });
  console.log(ents);
  boids = null;
  socket.emit("save", { studentname: "Haylee Ryan", statename: "state", data: ents});
}

function load(){
  socket.emit("load", { studentname: "Haylee Ryan", statename: "state" });
}

function Boid(game, x, y) {
    this.r = 15;
    this.maxSpeed = 5;
    this.maxForce = 0.03;
    this.game = game;
    this.acceleration = new Vector(0, 0);

    this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
    this.location = new Vector(x, y);

    Entity.call(this, game, x, y);

};

Boid.prototype = new Entity();
Boid.prototype.constructor = Boid;

Boid.prototype.flock = function () {
    var separation = this.separate(this.game.entities).multiply(1);
    var alignment = this.align(this.game.entities).multiply(1.5);
    var cohesion = this.cohere(this.game.entities).multiply(1);

    return separation.add(alignment).add(cohesion);
}

Boid.prototype.update = function () {

    this.acceleration = this.flock(this.game.entities);

    this.velocity = this.velocity.add(this.acceleration);

    this.location = this.location.add(this.velocity);

    this.acceleration = this.acceleration.multiply(0);
    Entity.prototype.update.call(this);

};

Boid.prototype.steer = function (target) {
    var desired = target.subtract(this.location);
    desired = desired.normalize();
    desired = desired.multiply(this.maxSpeed);
    var distance = desired.getMagnitude();

    var steer = new Vector(0, 0);
    steer = desired.subtract(this.velocity);
    steer = steer.limit(this.maxForce);

    return steer;

}

Boid.prototype.separate = function () {

  var average = new Vector(0, 0);
  var count = 0;
  var sep = 50;

  for (var i = 0; i < this.game.entities.length; i++) {

    var other = this.game.entities[i];
    var dx = this.location.x - other.location.x;
    var dy = this.location.y - other.location.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= 0 && distance < sep && this !== other) {

      var diff = new Vector(0, 0);
      diff = this.location.subtract(other.location);
      diff = diff.normalize();
      diff = diff.divide(distance);
      average = average.add(diff);
      count++;

    }
  }

  if (count > 0) {
      average = average.divide(count);
  }

  if (average.getMagnitude() > 0) {
    average = average.normalize();
    average = average.multiply(this.maxSpeed);
    average = average.subtract(this.velocity);
    average = average.limit(this.maxForce);
  }
  return average;

};

Boid.prototype.align = function() {

  var average = new Vector(0, 0);
  var count = 0;
  var radius = 100;

  for (var i = 0; i < this.game.entities.length; i++) {

    var other = this.game.entities[i];
    var dx = this.location.x - other.location.x;
    var dy = this.location.y - other.location.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
  }
    if (distance > 0 && distance < radius) {
      average = average.add(other.velocity);
      count++;
    }

    if (count > 0) {
      average = average.divide(count);
      average = average.normalize();
      average = average.multiply(this.maxSpeed);
      var steer = new Vector(0, 0);
      steer = average.subtract(this.velocity);
      return steer;
    } else {
      return new Vector(0, 0);
    }

};

Boid.prototype.cohere = function () {
  var sum = new Vector(0, 0);
  var count = 0;
  var radius = 100;

  for (var i = 0; i < this.game.entities.length; i++) {
        var other = this.game.entities[i];
        var dx = this.location.x - other.location.x;
        var dy = this.location.y - other.location.y;
        var distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && distance < radius) {
          sum = sum.add(other.location);
          count++;
        }
  }

  if (count > 0) {
    sum = sum.divide(count);
    return this.steer(sum.divide(count), sum.divide(count));
  } else {
    return sum;
  }

};



Boid.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = "Red";
    ctx.arc(this.location.x, this.location.y, this.r, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

    if (this.location.x < 0) this.location.x = 1400;
    if (this.location.y < 0) this.location.y = 1400;
    if (this.location.x > 1400) this.location.x = 0;
    if (this.location.y > 1400) this.location.y = 0;

};

//VECTOR CLASS

var Vector = function(x, y) {
  this.x = x;
  this.y = y;
};

Vector.prototype.getDirection = function() {
	return Math.atan2(this.y, this.x);
};

Vector.prototype.getMagnitude = function() {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x, this.y + v.y);
};

Vector.prototype.subtract = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
};

Vector.prototype.multiply = function(scalar) {
  return new Vector(this.x * scalar, this.y * scalar);
};

Vector.prototype.divide = function(scalar) {
  return new Vector(this.x / scalar, this.y / scalar);
};

Vector.prototype.normalize = function () {
  var mag = this.getMagnitude();
  return new Vector(this.x / mag, this.y / mag);
}

Vector.prototype.limit = function(highIN, lowIN) {
  var high = highIN;
  var low = lowIN;
  var ret = new Vector(0,0);
  if (this.getMagnitude() > high) {
    ret = this.normalize();
    ret = this.multiply(high);
  }
  if (this.getMagnitude() < low) {
    ret = this.normalize();
    ret = this.multiply(low);
  }
  return ret;
};


var gameEngine = new GameEngine();

window.onload = function () {

    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');


    var boid = new Boid(gameEngine);
    gameEngine.addEntity(boid);
    for (var i = 0; i < 98; i++) {
        boid = new Boid(gameEngine, 700 + (i * 10), 400 + (i * 10));
        gameEngine.addEntity(boid);
    }

    gameEngine.init(ctx);
    gameEngine.start();

    socket.on("connect", function () {
    console.log("Socket connected.")
});
socket.on("disconnect", function () {
    console.log("Socket disconnected.")
});
socket.on("reconnect", function () {
    console.log("Socket reconnected.")
});
};
