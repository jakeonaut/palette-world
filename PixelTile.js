function sameColor(c1, c2){
    return c1[0] == c2[0] && c1[1] == c2[1] && c1[2] == c2[2];
}
const f = (t) => {
    if (t > 0.008856) {
        return Math.pow(t, 1/3);
    }
    return 7.787 * t + (16/116);
}
// Thanks to https://www.cs.rit.edu/~ncs/color/t_convert.html
const xyzToLab = ([x, y, z]) => {
    const Xn = 96.4212; // 96.0489;
    const Yn = 100; // 100;
    const Zn = 82.5188; // 108.8840;
    const YYn = y / Yn;
    const XXn = x / Xn;
    const ZZn = z / Zn;
    const L = (YYn > 0.008856)
        ? (116 * Math.pow(YYn, 1/3) - 16)
        : (903.3 * YYn);
    const a = 500 * (f(XXn) - f(YYn));
    const b = 200 * (f(YYn) - f(ZZn));
    return [L, a, b];
};
// Thanks to https://www.cs.rit.edu/~ncs/color/t_convert.html
const rgbToXyz = ([r, g, b]) => {
    const mat = [
        [0.412453, 0.357580, 0.180423],
        [0.212671, 0.715160, 0.072169],
        [0.019334, 0.119193, 0.950227]
    ]
    const x = r * mat[0][0] + g * mat[0][1] + b * mat[0][2];
    const y = r * mat[1][0] + g * mat[1][1] + b * mat[1][2];
    const z = r * mat[2][0] + g * mat[2][1] + b * mat[2][2];
    return [x, y, z];
};
// Thanks to https://www.cs.rit.edu/~ncs/color/t_convert.html
const rgbToYiq = ([r, g, b]) => {
    const mat = [
        [0.299, 0.587, 0.114],
        [0.596, -0.275, -0.321],
        [0.212, -0.523, 0.311]
    ];
    const y = r * mat[0][0] + g * mat[0][1] + b * mat[0][2];
    const i = r * mat[1][0] + g * mat[1][1] + b * mat[1][2];
    const q = r * mat[2][0] + g * mat[2][1] + b * mat[2][2];
    return [y, i, q];
};
// Thanks to https://www.cs.rit.edu/~ncs/color/t_convert.html
const rgbToHsv = ([r, g, b]) => {
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const v = max;
    const delta = max - min;
    let h, s;
    if (max != 0) {
        s = delta / max;
    } else {
        s = 0;
        h = -1;
        return [h, s, v];
    }
    if (r === max) {
        h = (g - b) / delta;
    } else if (g === max) {
        h = 2 + (b - r) / delta;
    } else {
        h = 4 + (r - g) / delta;
    }
    h *= 60;
    if (h < 0) {
        h += 360;
    }
    return [h, s, v]; // haven't done it yet lol.
};
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
        // var closest_color = [0, 255, 0];
        var closest_color_index = 0;
        if (r === undefined) r = this.r;
        if (g === undefined) g = this.g;
        if (b === undefined) b = this.b;
        if (change_index === undefined) change_index = true;
        if (change_dither_index === undefined) change_dither_index = false;
        for (var i = 0; i < raw_palette.length; i++){
            let color1 = raw_palette[i];
            let color2 = [r, g, b];
            if (user_color_space === ColorSpace.EUCLIDEAN) {
                // do nothing.
            } else if (user_color_space === ColorSpace.CIELAB) {
                color1 = xyzToLab(rgbToXyz(color1));
                color2 = xyzToLab(rgbToXyz(color2));
            } else if (user_color_space === ColorSpace.XYZ) {
                color1 = rgbToXyz(color1);
                color2 = rgbToXyz(color2);
            } else if (user_color_space === ColorSpace.YIQ) {
                color1 = rgbToYiq(color1);
                color2 = rgbToYiq(color2);
            } else if (user_color_space === ColorSpace.HSV) {
                color1 = rgbToHsv(color1);
                color2 = rgbToHsv(color2);
            }
            let dist = Math.sqrt(
                Math.pow(color1[0]-color2[0], 2)
                + Math.pow(color1[1]-color2[1], 2)
                + Math.pow(color1[2]-color2[2], 2)
            );
            if (user_color_space === ColorSpace.REDMEAN) {
                const r_ = 0.5 * (color1[0] + color2[0]);
                dist = Math.sqrt(
                    ((2 + r_ / 256.0) * Math.pow(color1[0] - color2[0], 2))
                    + (4 * Math.pow(color1[1] - color2[1], 2))
                    + ((2 + ((255 - r_)/256.0)) * Math.pow(color1[2] - color2[2], 2))
                )
            }
            if (dist < min_dist){
                min_dist = dist;
                // closest_color = color;
                closest_color_index = i;
                if (change_index)
                    this.index = i;
                if (change_dither_index)
                    this.dither_index = i;
            }
        }
        return raw_palette[closest_color_index];
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
