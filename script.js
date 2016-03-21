/******************CHOOSE YOUR PALETTE*************************/
var chosen_palette = palettes["monochrome"];
/**************************************************************/

var canvas_orig, ctx_orig, canvas, ctx;
function sameColor(c1, c2){
    return c1[0] == c2[0] && c1[1] == c2[1] && c1[2] == c2[2];
}
function Pixel(r, g, b, a, x, y){
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    this.x = x;
    this.y = y;

    this.closestColor = function(raw_palette){
        var min_dist = 9999;
        var closest_color = [0, 255, 0];
        var r = this.r;
        var g = this.g;
        var b = this.b;
        raw_palette.forEach(function(color){
            var dist = Math.sqrt(
                Math.pow(color[0]-r, 2) +
                Math.pow(color[1]-g, 2) +
                Math.pow(color[2]-b, 2)
            );
            if (dist < min_dist){
                min_dist = dist;
                closest_color = color;
            }
        });
        return closest_color;
    }

    this.draw = function(palette){
        var color = this.closestColor(palette);
        var r = color[0], g = color[1], b = color[2];
        var fillStyle = "rgb("+r+","+g+","+b+")";
        ctx.fillStyle = fillStyle;
        ctx.fillRect(this.x, this.y, 1, 1);
    }
}

function Tile(){
    this.pixels = [];
    this.push = function(pixel){
        this.pixels.push(pixel);
    }
    this.draw = function(palette){
        var sub_palette = this.selectSubPalette(palette);
        this.pixels.forEach(function(pixel){
            pixel.draw(sub_palette);
        });
    }
    
    this.selectSubPalette = function(palette){
        //this is time intensive???
        var refined_palette = [palette[0]];
        var colors = {};
        
        this.pixels.forEach(function(pixel){
            var color = pixel.closestColor(palette);
            if (sameColor(color, refined_palette[0])) return;
            if (colors[color] === undefined){
                colors[color] = [color, 1];
            }else{
                colors[color][1]++;
            }
        });
        
        //do 3 times
        for (var i =0; i < 3; i++){
            //loop through the colors to pick the most popular one to
            //put in the "refined" palette
            var popular_color = palette[0];
            var popular_popularity = 0;
            for (var color in colors){
                var true_color = colors[color];
                var popularity = true_color[1];
                if (popularity > popular_popularity){
                    popular_popularity = popularity;
                    popular_color = true_color[0];
                }
            }
            refined_palette.push(popular_color);
            //remove color from "colors" so that we don't count it every
            //time
            delete colors[popular_color];
        }
        return refined_palette;
    }
}

function drawWithPalette(palette){
    var tile_size = 16;
    var tiles = [];

    console.log("start copying");
    //copy pixels into our tile array (from the original canvas)
    var imgData = ctx_orig.getImageData(0, 0, canvas_orig.width, canvas_orig.height).data;
    var x = 0;
    var y = 0;
    for (var i = 0; i < imgData.length; i+=4){
        var pixel = new Pixel(imgData[i], imgData[i+1], imgData[i+2], imgData[i+3], x, y);
        var tile_x = Math.floor(x / tile_size);
        var tile_y = Math.floor(y / tile_size);
        if (tile_x >= tiles.length)
            tiles.push([]);
        if (tile_y >= tiles[tile_x].length)
            tiles[tile_x].push(new Tile());
        tiles[tile_x][tile_y].push(pixel);

        x += 1;
        if (x >= canvas_orig.width){
            x = 0;
            y += 1;
        }
    }

    //now, draw the tiles onto the new canvas!
    console.log("start drawing");
    for (x = 0; x < tiles.length; x++){
        for (y = 0; y < tiles[x].length; y++){
            setTimeout(function(tile){
                tile.draw(palette);
            }.bind(this, tiles[x][y]), Math.floor(Math.random()*300));
        }
    }
}


function drawWithMetaPalette(palette){
    
}

//a very intensive process indeed...
function createMetaPalette(palette){
    //have every tile select its own optimal subpalette
        //that is composed of only 4 colors
        //assuming that the "shared" color amongst all palettes is black
    var sub_palettes = {};
}


function userSelectPalette(){
    var select = document.getElementById("user_palette");
    var palette_name = select.options[select.selectedIndex].value;
    chosen_palette = palettes[palette_name];
    drawWithPalette(chosen_palette);
}
function userUploadImage(){
   var file    = document.querySelector('input[type=file]').files[0]; //sames as here
   var reader  = new FileReader();

   reader.onloadend = function () {
       img = new Image();
       img.src = reader.result;
       init(img);
   }

   if (file) {
       reader.readAsDataURL(file); //reads the data as a URL
   } else {}
}

function init(img){
    canvas_orig = document.getElementById("original");
    ctx_orig = canvas_orig.getContext("2d");
    canvas = document.getElementById("new");
    ctx = canvas.getContext("2d");

    function loadHandler(){
        canvas_orig.width = img.width;
        canvas_orig.height = img.height;
        ctx_orig.drawImage(img, 0, 0);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = "000000";
        console.log(ctx.fillStyle);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawWithPalette(chosen_palette);
        //var meta_palette = createMetaPalette(chosen_palette);
        //drawWithMetaPalette(meta_palette);
    }

    img.onload = loadHandler;
    if (img.complete) loadHandler();
}
var img = new Image();
img.src = "parrot.png";
init(img);