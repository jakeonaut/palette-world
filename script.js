var Drawr = function(){};
Drawr.tiles = [];

Drawr.init = function(img){
    canvas_orig.width = img.width;
    canvas_orig.height = img.height;
    ctx_orig.drawImage(img, 0, 0);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = "000000";
    console.log(ctx.fillStyle);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var tile_size = 16;
    Drawr.tiles = [];

    console.log("start copying");
    //copy pixels into our tile array (from the original canvas)
    var imgData = ctx_orig.getImageData(0, 0, canvas_orig.width, canvas_orig.height).data;
    var x = 0;
    var y = 0;
    for (var i = 0; i < imgData.length; i+=4){
        var pixel = new Pixel(imgData[i], imgData[i+1], imgData[i+2], imgData[i+3], x, y);
        var tile_x = Math.floor(x / tile_size);
        var tile_y = Math.floor(y / tile_size);
        if (tile_x >= Drawr.tiles.length)
            Drawr.tiles.push([]);
        if (tile_y >= Drawr.tiles[tile_x].length)
            Drawr.tiles[tile_x].push(new Tile());
        Drawr.tiles[tile_x][tile_y].push(pixel);

        x += 1;
        if (x >= canvas_orig.width){
            x = 0;
            y += 1;
        }
    }
}

//http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


Drawr.drawWithPalette = function(palette){
    //display palette
    var palette_dom = document.getElementById("palette_area");
    palette_dom.innerHTML = "";
    for (var i = 0; i < palette.length; i++){
        var c = palette[i];
        var color_input = document.createElement("input");
        color_input.type = "color";
        color_input.color_id = i;
        color_input.onchange = function(e){
            var i = this.color_id;
            var hex = this.value;
            var rgb = hexToRgb(hex);
            user_palette[i] = [rgb.r, rgb.g, rgb.b];
            Drawr.drawWithPalette(user_palette);
        }
        color_input.className = "color";
        color_input.style.width = "18px";
        color_input.style.height = "18px";
        color_input.style.backgroundColor = "rgb("+c[0]+","+c[1]+","+c[2]+")";
        color_input.value = rgbToHex(c[0], c[1], c[2]);

        palette_dom.appendChild(color_input);
    }

    //now, draw the tiles onto the new canvas!
    console.log("start drawing");
    if (user_color_mode === ColorMode.CLOSEST_COLOR){
        for (var x = 0; x < Drawr.tiles.length; x++){
            for (var y = 0; y < Drawr.tiles[x].length; y++){
                setTimeout(function(tile){
                    tile.draw(palette);
                }.bind(this, Drawr.tiles[x][y]), Math.floor(Math.random()*300));
            }
        }
    }
    else if (user_color_mode === ColorMode.HICOLOR){
        //median cut algorithm
        var colors = {};
        var min_r = 999, max_r = 0;
        var min_g = 999, max_g = 0;
        var min_b = 999, max_b = 0;
        var buckets = [];

        for (var x = 0; x < Drawr.tiles.length; x++){
            for (var y = 0; y < Drawr.tiles[x].length; y++){
                var tile = Drawr.tiles[x][y];
                for (var i = 0; i < tile.pixels.length; i++){
                    var p = tile.pixels[i];
                    if (p.r > max_r) max_r = p.r;
                    if (p.r < min_r) min_r = p.r;
                    if (p.g > max_g) max_g = p.g;
                    if (p.g < min_g) min_g = p.g;
                    if (p.b > max_b) max_b = p.b;
                    if (p.b < min_b) min_b = p.b;
                    var color = [p.r, p.g, p.b];
                    //FUCK I DONT KNOW HOW TO DO BUCKETS AND THIS IS A LOT OF SORTING
                    bucket.push(color);
                }
            }
        }
        //TODO::
    }
}
