function sameColor(c1, c2){
    return c1[0] == c2[0] && c1[1] == c2[1] && c1[2] == c2[2];
}
function Pixel(r, g, b, a, x, y){
    this.r = r;
    this.g = g;
    this.b = b;
    this.dither_r = r;
    this.dither_g = g;
    this.dither_b = b;
    this.a = a;
    this.x = x;
    this.y = y;
    this.index = 0;
    this.dither_index = 0;
    this.m = new Array(
        [1, 9, 3, 11],
        [13, 5, 15, 7],
        [4, 12, 2, 10],
        [16, 8, 14, 6]
    );

    this.closestColor = function(raw_palette, r, g, b, change_index, change_dither_index){
        var min_dist = 9999;
        var closest_color = [0, 255, 0];
        if (r === undefined) r = this.r;
        if (g === undefined) g = this.g;
        if (b === undefined) b = this.b;
        if (change_index === undefined) change_index = true;
        if (change_dither_index === undefined) change_dither_index = false;
        for (var i = 0; i < raw_palette.length; i++){
            var color = raw_palette[i];
            var dist = Math.sqrt(
                Math.pow(color[0]-r, 2) +
                Math.pow(color[1]-g, 2) +
                Math.pow(color[2]-b, 2)
            );
            if (dist < min_dist){
                min_dist = dist;
                closest_color = color;
                if (change_index)
                    this.index = i;
                if (change_dither_index)
                    this.dither_index = i;
            }
        }
        return closest_color;
    }

    this.recolor = function(palette){
        var color = this.closestColor(palette);
        this.r = color[0];
        this.g = color[1];
        this.b = color[2];

        var ratio = 3*(this.m[this.x%this.m.length][this.y%this.m[0].length]);
        var r = this.r + ratio;
        var g = this.g + ratio;
        var b = this.b + ratio;
        color = this.closestColor(palette, r, g, b, false, true);
        this.dither_r = color[0];
        this.dither_g = color[1];
        this.dither_b = color[2];

        if (!user_dithering){
            this.draw(null, [this.r, this.g, this.b]);
        }else{
            this.draw(null, [this.dither_r, this.dither_g, this.dither_b]);
        }
    }

    this.draw = function(palette, color){
        if (color === undefined){
            color = this.closestColor(palette);
        }
        var r = color[0], g = color[1], b = color[2];
        var fillStyle = "rgb("+r+","+g+","+b+")";
        ctx.fillStyle = fillStyle;
        ctx.fillRect(this.x, this.y, 1, 1);
    }
    this.draw_dithered = function(palette){
        var ratio = 3*(this.m[this.x%this.m.length][this.y%this.m[0].length]);
        var r = this.r + ratio;
        var g = this.g + ratio;
        var b = this.b + ratio;
        var color = this.closestColor(palette, r, g, b, false);
        r = color[0]; g = color[1]; b = color[2];
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
        if (user_tiled_palettes)
            palette = this.selectSubPalette(palette);
        this.pixels.forEach(function(pixel){
            if (user_dithering)
                pixel.draw_dithered(palette);
            else pixel.draw(palette);
        });
    }
    this.hicolorDraw = function(palette){
        this.pixels.forEach(function(pixel){
            if (user_dithering){
                pixel.draw(palette, palette[hicolor_mapping[pixel.dither_index]]);
            }else{
                pixel.draw(palette, palette[hicolor_mapping[pixel.index]]);
            }
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
