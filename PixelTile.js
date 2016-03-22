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

    this.closestColor = function(raw_palette, r, g, b){
        var min_dist = 9999;
        var closest_color = [0, 255, 0];
        if (r === undefined) r = this.r;
        if (g === undefined) g = this.g;
        if (b === undefined) b = this.b;
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
    this.draw_dithered = function(palette){
        var m = new Array(
            [1, 9, 3, 11],
            [13, 5, 15, 7],
            [4, 12, 2, 10],
            [16, 8, 14, 6]
        );
        var ratio = 3*(m[this.x%m.length][this.y%m[0].length]);
        var r = this.r + ratio;
        var g = this.g + ratio;
        var b = this.b + ratio;
        var color = this.closestColor(palette, r, g, b);
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
