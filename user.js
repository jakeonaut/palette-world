var ColorMode = function(){}
ColorMode.CLOSEST_COLOR = 0;
ColorMode.HICOLOR = 1;

/******************CHOOSE YOUR PALETTE*************************/
var user_palette = palettes["monochrome"].slice(0);
    var hicolor_mapping = [];
var user_color_mode = ColorMode.CLOSEST_COLOR;
var user_dithering = true;
var user_tiled_palettes = false;
/**************************************************************/

function userSelectPalette(){
    var select = document.getElementById("user_palette");
    var palette_name = select.options[select.selectedIndex].value;
    if (!isNaN(palette_name)){
        var n = Number(palette_name);
        user_palette = [];
        for (var i = 0; i < n; i++){
            var r = Math.floor(Math.random()*256);
            var g = Math.floor(Math.random()*256);
            var b = Math.floor(Math.random()*256);
            user_palette.push([r, g, b]);
        }
    }
    else{
        user_palette = palettes[palette_name].slice(0);
    }
    Drawr.drawWithPalette(user_palette);
}

function userSelectColorStyle(){
    var select = document.getElementById("color_style");
    var color_mode = select.options[select.selectedIndex].value;

    if (color_mode === "closest_color")
        user_color_mode = ColorMode.CLOSEST_COLOR;
    if (color_mode === "hicolor")
        user_color_mode = ColorMode.HICOLOR;

    Drawr.init(img);
    if (user_color_mode === ColorMode.CLOSEST_COLOR)
        Drawr.drawWithPalette(user_palette);
}

function userToggleDithering(){
    user_dithering = !user_dithering;
    Drawr.drawWithPalette(user_palette);
}
function userToggleTiledPalettes(){
    user_tiled_palettes = !user_tiled_palettes;
    Drawr.drawWithPalette(user_palette);
}
function userUploadImage(){
   var file    = document.querySelector('input[type=file]').files[0]; //sames as here
   var reader  = new FileReader();

   reader.onloadend = function () {
       img = new Image();
       img.src = reader.result;
       img.onload = function(){
           Drawr.init(img);
           Drawr.drawWithPalette(user_palette);
       }
   }

   if (file) {
       reader.readAsDataURL(file); //reads the data as a URL
   } else {}
}
