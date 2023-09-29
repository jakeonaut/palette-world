var ColorMode = function(){}
ColorMode.CLOSEST_COLOR = 0;
ColorMode.HICOLOR = 1;

/******************CHOOSE YOUR PALETTE*************************/
var user_palette = palettes["monochrome"].slice(0);
    var hicolor_mapping = [];
var user_color_mode = ColorMode.CLOSEST_COLOR;
var hide_src_img = false
var user_dithering = true;
var user_tiled_palettes = false;
var user_zoom_level = 1
/**************************************************************/

function userSelectPalette(){
    var select = document.getElementById("user_palette");
    var palette_name = select.options[select.selectedIndex].value;
    if (!isNaN(palette_name)){
        var n = Number(palette_name);
        if (n > 0){
            user_palette = [];
            for (var i = 0; i < n; i++){
                var r = Math.floor(Math.random()*256);
                var g = Math.floor(Math.random()*256);
                var b = Math.floor(Math.random()*256);
                user_palette.push([r, g, b]);
            }
        }else{
            user_palette = Drawr.quantizeColor(img);
        }
    }
    else{
        user_palette = palettes[palette_name].slice(0);
    }
    Drawr.drawWithPalette(user_palette);
}

var paletteCanvas = document.getElementById("palette");
var paletteContext = paletteCanvas.getContext("2d");
function userUploadPalette() {
   var file    = document.querySelector('input[type=file]#userPalette').files[0]; //sames as here
   var reader  = new FileReader();

   reader.onloadend = function () {
       img = new Image();
       img.src = reader.result;
       img.onload = function(){
           paletteCanvas.width = img.width;
           paletteCanvas.height = img.height;
           paletteContext.drawImage(img, 0, 0);
           var palette_data = paletteContext.getImageData(0, 0, img.width, 1).data;
           
            var n = img.width;
            user_palette = [];
            for (var i = 0; i < n; i++){
                var index = i * 4;
                var r = Math.floor(palette_data[index]);
                var g = Math.floor(palette_data[index+1]);
                var b = Math.floor(palette_data[index+2]);
                user_palette.push([r, g, b]);
            }
            Drawr.drawWithPalette(user_palette);
       }
   }

   if (file) {
       reader.readAsDataURL(file); //reads the data as a URL
   } else {}
}

function userSelectZoom() {
    var select = document.getElementById("user_zoom");
    user_zoom_level = Number(select.options[select.selectedIndex].value);

    Drawr.init(img, user_zoom_level);
    Drawr.drawWithPalette(user_palette);
}

function userSelectColorStyle(){
    var select = document.getElementById("color_style");
    var color_mode = select.options[select.selectedIndex].value;

    if (color_mode === "closest_color")
        user_color_mode = ColorMode.CLOSEST_COLOR;
    if (color_mode === "hicolor")
        user_color_mode = ColorMode.HICOLOR;

    Drawr.init(img, user_zoom_level);
    if (user_color_mode === ColorMode.CLOSEST_COLOR)
        Drawr.drawWithPalette(user_palette);
}

document.getElementById("user_hide_src_img").checked = hide_src_img;
function userToggleHideSourceImg() {
    hide_src_img = !hide_src_img;
    document.getElementById("original").style.display = hide_src_img ? "none" : "";
    document.getElementById("user_hide_src_img").checked = hide_src_img;
}
document.getElementById("user_dithering").checked = user_dithering;
function userToggleDithering(){
    user_dithering = !user_dithering;
    Drawr.drawWithPalette(user_palette);
    document.getElementById("user_dithering").checked = user_dithering;
}
document.getElementById("user_tiled_palettes").checked = user_tiled_palettes;
function userToggleTiledPalettes(){
    user_tiled_palettes = !user_tiled_palettes;
    Drawr.drawWithPalette(user_palette);
    document.getElementById("user_tiled_palettes").checked = user_tiled_palettes;
}
function userUploadImage(){
   var file    = document.querySelector('input[type=file]#userImage').files[0]; //sames as here
   var reader  = new FileReader();

   reader.onloadend = function () {
       img = new Image();
       img.src = reader.result;
       img.onload = function(){
           Drawr.init(img, user_zoom_level);
           Drawr.drawWithPalette(user_palette);
       }
   }

   if (file) {
       reader.readAsDataURL(file); //reads the data as a URL
   } else {}
}
