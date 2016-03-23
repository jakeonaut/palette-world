var Drawr = function(){};
Drawr.tiles = [];

Drawr.init = function(img){
    canvas_orig.width = img.width;
    canvas_orig.height = img.height;
    ctx_orig.drawImage(img, 0, 0);

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.fillStyle = "000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var tile_size = 16;
    Drawr.tiles = [];

    console.log("start copying");
    //copy pixels into our tile array (from the original canvas)
    var w = canvas_orig.width;
    var h = canvas_orig.height;
    var imgData = ctx_orig.getImageData(0, 0, w, h).data;
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

    if (user_color_mode === ColorMode.HICOLOR){
        Drawr.hicolorInit(user_palette);
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
        for (var x = 0; x < Drawr.tiles.length; x++){
            for (var y = 0; y < Drawr.tiles[x].length; y++){
                setTimeout(function(tile){
                    tile.hicolorDraw(palette);
                }.bind(this, Drawr.tiles[x][y]), Math.floor(Math.random()*300));
            }
        }
    }
}

Drawr.hicolorInit = function(palette){
    //median cut algorithm
    var min_r = 999, max_r = 0;
    var min_g = 999, max_g = 0;
    var min_b = 999, max_b = 0;
    var buckets = [[]];

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

                buckets[0].push(color);
            }
        }
    }

    //divide into buckets
    while (buckets.length < palette.length){
        var new_buckets = [];
        for (var i = 0; i < buckets.length; i++){
            //SORT THE BUCKET
            var sort_index = 0;
            if (max_g - min_g > max_r - min_r){
                sort_index = 1;
                if (max_b - min_b > max_g - min_g){
                    sort_index = 2;
                }
            }else if (max_b - min_b > max_r - min_r){
                sort_index = 2;
            }

            buckets[i].sort(function(x, y){
                return x[sort_index] > y[sort_index];
            });
            var mid = Math.floor(buckets[i].length/2);
            new_buckets.push(buckets[i].slice(0, mid));
            new_buckets.push(buckets[i].slice(mid, buckets[i].length));
        }
        buckets = new_buckets;
    }

    //average the bucket colors
    var quantized_color_palette = [];
    for (var i = 0; i < buckets.length; i++){
        var avg_r = 0, avg_g = 0, avg_b = 0;
        for (var j = 0; j < buckets[i].length; j++){
            avg_r += buckets[i][j][0];
            avg_g += buckets[i][j][1];
            avg_b += buckets[i][j][2];
        }
        quantized_color_palette.push(
            [
                Math.round(avg_r / buckets[i].length),
                Math.round(avg_g / buckets[i].length),
                Math.round(avg_b / buckets[i].length)
            ]
        );
    }

    //NOW, recolor the pixels according to the quantized colors
    for (var x = 0; x < Drawr.tiles.length; x++){
        for (var y = 0; y < Drawr.tiles[x].length; y++){
            var tile = Drawr.tiles[x][y];
            for (var i = 0; i < tile.pixels.length; i++){
                tile.pixels[i].recolor(quantized_color_palette);
            }
        }
    }

    //map every quantized color to a color from the user palette
    var final_palette = [];
    for (var i = 0; i < palette.length; i++){
        final_palette.push([palette[i], true]);
        quantized_color_palette[i] = [quantized_color_palette[i], true];
    }

    hicolor_mapping = {};
    while (true){
        var quantized_color = null;
        var final_color = null;
        var color_distance = 999;
        for (var i = 0; i < quantized_color_palette.length; i++){
            if (!quantized_color_palette[i][1]) continue;
            for (var j = 0; j < final_palette.length; j++){
                if (!final_palette[j][1]) continue;

                var c1 = quantized_color_palette[i][0];
                var c2 = final_palette[j][0];
                var dist = Math.sqrt(
                    Math.pow(c1[0]-c2[0], 2) +
                    Math.pow(c1[1]-c2[1], 2) +
                    Math.pow(c1[2]-c2[2], 2)
                );
                if (dist < color_distance){
                    quantized_color = i;
                    final_color = j;
                    color_distance = dist;
                }
            }
        }
        if (quantized_color === null) break;
        hicolor_mapping[quantized_color] = final_color;
        final_palette[final_color] = false;
        quantized_color_palette[quantized_color] = false;
    }
}
