var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var TILE_SIZE = 55;
var PEEP_SIZE = 50;

var GRID_SIZE = 10;

var DIAGONAL_SQUARED = (TILE_SIZE+5)*(TILE_SIZE+5) + (TILE_SIZE+5)*(TILE_SIZE+5);

var assetsLeft = 0;
var onImageLoaded = function(){
	assetsLeft--;
};

var images = {};
function addAsset(name,src){
	assetsLeft++;
	images[name] = new Image();
	images[name].onload = onImageLoaded;
	images[name].src = src;
}
addAsset("yayTriangle","../img/yay_triangle.png");
addAsset("yayTriangleBlink","../img/yay_triangle_blink.png");
addAsset("mehTriangle","../img/meh_triangle.png");
addAsset("sadTriangle","../img/sad_triangle.png");
addAsset("yaySquare","../img/yay_square.png");
addAsset("yaySquareBlink","../img/yay_square_blink.png");
addAsset("mehSquare","../img/meh_square.png");
addAsset("sadSquare","../img/sad_square.png");
addAsset("whiteCircle","../img/circle_white.png");
addAsset("whiteTriangle","../img/triangle_white.png");
addAsset("yellowTriangle","../img/triangle_yellow.png");
addAsset("sadCircle","../img/unhappy_circle_white.png");


var IS_PICKING_UP = false;
var lastMouseX, lastMouseY;
var CHARISMA = 0.005;

function Draggable(x,y){
	
	var self = this;
	self.x = x;
	self.y = y;
	self.gotoX = x;
	self.gotoY = y;

	var offsetX, offsetY;
	var pickupX, pickupY;
	self.pickup = function(){

		IS_PICKING_UP = true;

		pickupX = (Math.floor(self.x/TILE_SIZE)+0.5)*TILE_SIZE;
		pickupY = (Math.floor(self.y/TILE_SIZE)+0.5)*TILE_SIZE;
		offsetX = Mouse.x-self.x;
		offsetY = Mouse.y-self.y;
		self.dragged = true;

		// Dangle
		self.dangle = 0;
		self.dangleVel = 0;

		// Draw on top
		var index = draggables.indexOf(self);
		draggables.splice(index,1);
		draggables.push(self);

	};

	self.drop = function(){

		IS_PICKING_UP = false;

		var px = Math.floor(Mouse.x/TILE_SIZE);
		var py = Math.floor(Mouse.y/TILE_SIZE);
		if(px<0) px=0;
		if(px>=GRID_SIZE) px=GRID_SIZE-1;
		if(py<0) py=0;
		if(py>=GRID_SIZE) py=GRID_SIZE-1;
		var potentialX = (px+0.5)*TILE_SIZE;
		var potentialY = (py+0.5)*TILE_SIZE;

		var spotTaken = false;
		for(var i=0;i<draggables.length;i++){
			var d = draggables[i];
			if(d==self) continue;
			var dx = d.x-potentialX;
			var dy = d.y-potentialY;
			if(dx*dx+dy*dy<10){
				spotTaken=true;
				break;
			}
		}

		if(spotTaken){
			self.gotoX = pickupX;
			self.gotoY = pickupY;
		}else{
			self.gotoX = potentialX;
			self.gotoY = potentialY;
		}

		self.dragged = false;

	}

	var lastPressed = false;
	self.update = function(){

		// Shakiness?
		self.shaking = false;
		self.bored = false;
		self.changeable = false;
		if(!self.dragged){
			var neighbors = 0;
			var same = 0;
			var notSame = 0;
			//console.log(draggables.length);
			for(var i=0;i<draggables.length;i++){
				var d = draggables[i];
				if(d==self) continue;
				var dx = d.x-self.x;
				var dy = d.y-self.y;
				if(dx*dx+dy*dy<DIAGONAL_SQUARED){
					neighbors++;
					if(d.color==self.color){
						same++;
					}else {
						notSame++;
					}
				}
			}
			if(neighbors>0 && (same/neighbors)<0.33){
				self.shaking = true;
			}
			if(neighbors==0 || (same/neighbors)>0.99){
				self.shaking = true;
				self.bored = true;
			}
			if(neighbors>0 && notSame>0) {
				self.changeable = true;
			}
		}

		// Dragging
		if(!self.dragged){
			if(self.shaking && Mouse.pressed && !lastPressed){
				var dx = Mouse.x-self.x;
				var dy = Mouse.y-self.y;
				if(Math.abs(dx)<PEEP_SIZE/2 && Math.abs(dy)<PEEP_SIZE/2){
					self.pickup();
				}
			}
		}else{
			self.gotoX = Mouse.x - offsetX;
			self.gotoY = Mouse.y - offsetY;
			if(!Mouse.pressed){
				self.drop();
			}
		}
		lastPressed = Mouse.pressed;

		// Going to where you should
		self.x = self.x*0.5 + self.gotoX*0.5;
		self.y = self.y*0.5 + self.gotoY*0.5;

	};

	self.frame = 0;
	self.blinking=0;
	console.log(CHARISMA);
	self.draw = function(){
		ctx.save();
		ctx.translate(self.x,self.y);
		if(self.shaking){
			self.frame+=0.07;
			ctx.translate(0,20);
			ctx.rotate(Math.sin(self.frame-(self.x+self.y)/200)*Math.PI*0.05);
			ctx.translate(0,-20);
		}

		// Blinking
		if(Math.random()<0.01){
			self.blinking=10;
		}

		// Draw thing
		var img;
		//circles are the good guys
		if(self.color=="circle"){ 
			if(self.shaking){
				img = images.whiteCircle;
			}else if(self.bored){
				img = images.whiteCircle;
			}else{
					if(self.dragged && !self.shaking) {			
						img = images.whiteCircle;
					}else {
						img = images.sadCircle;
					}			
			}
		}else if(self.color == "spreader") {
			img = images.yellowTriangle;
			self.dragged = false;
			if(self.changeable && reverse) {
				if(Math.random()<CHARISMA){
					console.log(CHARISMA);
					self.color = "circle";
				}
			}else {
				self.color = "spreader";
			}
		}else if(self.color == "box") {
			img = images.whiteCircle;
		} else {
			if(self.shaking) {
				img = images.whiteTriangle;
			}else if(self.bored) {
				img = images.whiteTriangle;
			}else {
				img = images.whiteCircle;
				if(self.dragged && !self.shaking && !lastPressed) {
					img = images.whiteCircle;
				}else {
					if(self.changeable && self.x == pickupX && self.y == pickupY) {
						img = images.whiteCircle;
						// self.color = "circle";
					}else {
						img = images.whiteCircle;
						//self.color = "circle";
					}
				}
			}
		}
		
		// Dangle
		if(self.dragged){
			self.dangle += (lastMouseX-Mouse.x)/100;
			ctx.rotate(-self.dangle);
			self.dangleVel += self.dangle*(-0.02);
			self.dangle += self.dangleVel;
			self.dangle *= 0.9;
		}

		ctx.drawImage(img,-PEEP_SIZE/2,-PEEP_SIZE/2,PEEP_SIZE,PEEP_SIZE);
		ctx.restore();
	};

}
var reverse = false;
function reverseButton() {
	reverse = true;
}

var draggables;
//reset function allows you to set random tiles on the board.
function reset(){
	draggables = [];
	//wanted to break up small group and big group
	for(var x=8;x<9;x++){
		for(var y=2;y<3;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "circle";
				draggables.push(draggable);
			
		}
	}
	for(var x=0;x<1;x++){
		for(var y=0;y<5;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);	
		}
	}
	for(var x=1;x<3;x++){
		for(var y=0;y<1;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			
		}
	}
	for(var x=2;x<3;x++){
		for(var y=1;y<3;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			
		}
	}
	for(var x=4;x<5;x++){
		for(var y=2;y<3;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			
		}
	}
	for(var x=5;x<6;x++){
		for(var y=1;y<2;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			
		}
	}
	for(var x=5;x<6;x++){
		for(var y=3;y<4;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			
		}
	}
	for(var x=5;x<7;x++){
		for(var y=2;y<3;y++){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			
		}
	}
	for(var x=0;x<10;x++){
		for(var y=5;y<9;y++){
			if(Math.random()<0.90){
				var draggable = new Draggable((x+0.5)*TILE_SIZE, (y+0.5)*TILE_SIZE);
				draggable.color = "spreader";
				draggables.push(draggable);
			}
		}
	}
	reverse = false;
}
reset();

function render(){

	if(assetsLeft>0) return;
	
	// Draw
	Mouse.isOverDraggable = IS_PICKING_UP;
	ctx.clearRect(0,0,canvas.width,canvas.height); //WIDTH AND HEIGHT AT 550
	for(var i=0;i<draggables.length;i++){
		var d = draggables[i];
		d.update();

		if(d.shaking){
			var dx = Mouse.x-d.x;
			var dy = Mouse.y-d.y;
			if(Math.abs(dx)<PEEP_SIZE/2 && Math.abs(dy)<PEEP_SIZE/2){
				Mouse.isOverDraggable = true;
			}
		}

	}
	for(var i=0;i<draggables.length;i++){
		draggables[i].draw();
	}

	// Mouse
	lastMouseX = Mouse.x;
	lastMouseY = Mouse.y;

	// Done?
	if(isDone()){
		doneBuffer--;
		if(doneBuffer==0){
			doneAnimFrame = 30;
			console.log("DONE");
		}
	}else{
		doneBuffer = 30;
	}
	if(doneAnimFrame>0){
		doneAnimFrame--;
		var opacity = ((doneAnimFrame%15)/15)*0.2;
		canvas.style.background = "rgba(255,255,255,"+opacity+")";
	}else{
		canvas.style.background = "none";
	}

}

var doneAnimFrame = 0;
var doneBuffer = 30;
function isDone(){
	if(Mouse.pressed) return false;
	for(var i=0;i<draggables.length;i++){
		var d = draggables[i];
		//if(d.shaking) return false;
		if(d.color != "circle") return false;
	}
	return true;
}

////////////////////
// ANIMATION LOOP //
////////////////////
window.requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	function(callback){ window.setTimeout(callback, 1000/60); };
(function animloop(){
	requestAnimFrame(animloop);
	if(window.IS_IN_SIGHT){
		render();
	}
})();
window.IS_IN_SIGHT = false;
