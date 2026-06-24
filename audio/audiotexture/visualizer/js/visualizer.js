
var sideWidth = 90;
var topMargin = 0;

var audioDuration   = 0;   // seconds
var currentPosition = 0;   // seconds
var currentSrc;
var currentXML;

var indicatorX     = 0;   // pixels;

var segBoxes      = [];
var segIndicator  = [];
var segLabels     = [];
var segEventList  = [];
var segLabelAmount= 0;

var signalWave     = [];
var signalRMS      = [];
var signalSpec     = [];
var signalSpecRow  = 0;
var signalSpecCol  = 0;
var signalBoxes    = [];
var signalBoxes2   = [];
var signalIndicator= [];
var signalLabels   = [];

var segCanvas;
var segCTX;
var segWIDTH;
var segHEIGHT;

var signalCanvas;
var signalCTX;
var signalWIDTH;
var signalHEIGHT;

var INTERVAL = 50;   // how often, in milliseconds, we check to see if a redraw is needed
var mx, my;          // mouse coordinates

// Flags
var playing         = false;
var playAnnoMarkers = false;
var playMarkers     = false;
var canvasValid     = false;

var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

var aEvent = new audioEvent();
var xml;

// Hot keys definitions
// ========================
$(document).bind("keydown","space", function() {
  if($("#jquery_jplayer_1").data("jPlayer").status.paused){
    $("#jquery_jplayer_1").jPlayer("play");
  }else{
    $("#jquery_jplayer_1").jPlayer("pause");
  }
});

self.update_timer = function (event){
       var status = event.jPlayer.status;
       currenPosition= status.currentTime;
       updatePlayIndicator();
       //$("#jtimer").text($.jPlayer.convertTime(status.duration))
       //$("#jtimer").text(status.duration);
       //$("#jtimer").text(status.currentTime);
       //$("#jtimer").text(status.src);
};

$(document).ready(function(){
    $('a#playMarker').click(function(){
        $(this).toggleClass("button-down");
        if(playMarkers){
            playMarkers = false;
        }else{
            playMarkers = true;
        }
    });
    $('a#playAnnoMarker').click(function(){
        $(this).toggleClass("button-down");
        if(playAnnoMarkers){
            playAnnoMarkers = false;
        }else{
            playAnnoMarkers = true;
        }
    });


    var Playlist = function(instance, playlist, options) {
        var self = this;

        this.instance = instance; // String: To associate specific HTML with this playlist
        this.playlist = playlist; // Array of Objects: The playlist
        this.options = options; // Object: The jPlayer constructor options for this playlist

        this.current = 0;

        this.cssId = {
                jPlayer: "jquery_jplayer_",
                interface: "jp_interface_",
                playlist: "jp_playlist_"
        };
        this.cssSelector = {};

        $.each(this.cssId, function(entity, id) {
                self.cssSelector[entity] = "#" + id + self.instance;
        });

        if(!this.options.cssSelectorAncestor) {
                this.options.cssSelectorAncestor = this.cssSelector.interface;
        }

        $(this.cssSelector.jPlayer).jPlayer(this.options);

        $(this.cssSelector.interface + " .jp-previous").click(function() {
                self.playlistPrev();
                $(this).blur();
                return false;
        });

        $(this.cssSelector.interface + " .jp-next").click(function() {
                self.playlistNext();
                $(this).blur();
                return false;
        });
   };
   Playlist.prototype = {
        displayPlaylist: function() {
            var self = this;
            $(this.cssSelector.playlist + " ul").empty();
            for (i=0; i < this.playlist.length; i++) {
                var listItem = (i === this.playlist.length-1) ? "<li class='jp-playlist-last'>" : "<li>";
                listItem += "<a href='#' id='" + this.cssId.playlist + this.instance + "_item_" + i +"' tabindex='1'>"+ this.playlist[i].name +"</a>";

                // Create links to free media
                if(this.playlist[i].free) {
                    var first = true;
                    listItem += "<div class='jp-free-media'>(";
                    $.each(this.playlist[i], function(property,value) {
                        if($.jPlayer.prototype.format[property]) { // Check property is a media format.
                            if(first) {
                                    first = false;
                            } else {
                                    listItem += " | ";
                            }
                            listItem += "<a id='" + self.cssId.playlist + self.instance + "_item_" + i + "_" + property + "' href='" + value + "' tabindex='1'>" + property + "</a>";
                        }
                    });
                    listItem += ")</span>";
                }

                listItem += "</li>";

                // Associate playlist items with their media
                $(this.cssSelector.playlist + " ul").append(listItem);
                $(this.cssSelector.playlist + "_item_" + i).data("index", i).click(function() {
                    var index = $(this).data("index");
                    if(self.current !== index) {
                        self.playlistChange(index);
                    } else {
                        $(self.cssSelector.jPlayer).jPlayer("play");
                    }
                    $(this).blur();
                    return false;
                });

                // Disable free media links to force access via right click
                if(this.playlist[i].free) {
                    $.each(this.playlist[i], function(property,value) {
                        if($.jPlayer.prototype.format[property]) { // Check property is a media format.
                            $(self.cssSelector.playlist + "_item_" + i + "_" + property).data("index", i).click(function() {
                                var index = $(this).data("index");
                                $(self.cssSelector.playlist + "_item_" + index).click();
                                $(this).blur();
                                return false;
                            });
                        }
                    });
                }
            }
        },
        playlistInit: function(autoplay) {
            if(autoplay) {
                this.playlistChange(this.current);
            } else {
                this.playlistConfig(this.current);
            }
        },
        playlistConfig: function(index) {
            $(this.cssSelector.playlist + "_item_" + this.current).removeClass("jp-playlist-current").parent().removeClass("jp-playlist-current");
            $(this.cssSelector.playlist + "_item_" + index).addClass("jp-playlist-current").parent().addClass("jp-playlist-current");
            this.current = index;
            $(this.cssSelector.jPlayer).jPlayer("setMedia", this.playlist[this.current]);
            $("#filename").html(this.playlist[this.current].name);
        },
        playlistChange: function(index) {
            this.playlistConfig(index);
            $(this.cssSelector.jPlayer).jPlayer("play");
        },
        playlistNext: function() {
            var index = (this.current + 1 < this.playlist.length) ? this.current + 1 : 0;
            this.playlistChange(index);
        },
        playlistPrev: function() {
            var index = (this.current - 1 >= 0) ? this.current - 1 : this.playlist.length - 1;
            this.playlistChange(index);
        }
    };
    var audioPlaylist = new Playlist("1", [
            {
                name:"Restaurant #2 - audio texture",
                free:false,
                oga:"../audio/audiotexture/visualizer/media/restaurant02_audiotexture.ogg"
            },
            {
                name:"Street #1 - audio texture",
                free:false,
                oga:"../audio/audiotexture/visualizer/media/street01_audiotexture.ogg"
            },
            {
                name:"Track&fields #1 - audio texture",
                free:false,
                oga:"../audio/audiotexture/visualizer/media/tracknfield01_audiotexture.ogg"
            },
            {
                name:"Pub #3 - audio texture",
                free:false,
                oga:"../audio/audiotexture/visualizer/media/pub03_audiotexture.ogg"
            }
	], {
		ready: function() {
                    audioPlaylist.displayPlaylist();
                    audioPlaylist.playlistInit(false); // Parameter is a boolean for autoplay.
                    initVis();
		},
		ended: function() {
                    audioPlaylist.playlistNext();
		},
		play: function() {
                    $(this).jPlayer("pauseOthers").bind($.jPlayer.event.timeupdate,self.update_timer);
                    initVis();
		},
		swfPath: "js",
		supplied: "oga"
	});
});


function updatePlayIndicator(){
    segIndicator.x    = Math.round(sideWidth+((segWIDTH-sideWidth)*currenPosition/audioDuration));
    signalIndicator.x = Math.round(sideWidth+((signalWIDTH-sideWidth)*currenPosition/audioDuration));
    invalidate();
}
function seekAudio(pos){
    var status = $("#jquery_jplayer_1").data("jPlayer").status;
    var currentTime = status.currentTime;
    $("#jquery_jplayer_1").jPlayer("playHead",pos);
}
function initVis(){
    var status = $("#jquery_jplayer_1").data("jPlayer").status;

    segBoxes     = [];  // holds all rectangles
    segIndicator = [];  //
    segLabels    = [];  //
    segEventList = [];  //

    currentSrc = status.src;
    currentXML = currentSrc.replace(".ogg",".xml");

    segCanvas = document.getElementById("segmentationCanvas");
    segHEIGHT = segCanvas.height;
    segWIDTH  = segCanvas.width;
    segCTX    = segCanvas.getContext('2d');

    // fixes mouse co-ordinate problems when there's a border or padding
    if (document.defaultView && document.defaultView.getComputedStyle) {
        stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(segCanvas, null)['paddingLeft'], 10)      || 0;
	stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(segCanvas, null)['paddingTop'], 10)       || 0;
	styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(segCanvas, null)['borderLeftWidth'], 10)  || 0;
	styleBorderTop   = parseInt(document.defaultView.getComputedStyle(segCanvas, null)['borderTopWidth'], 10)   || 0;
    }

    segIndicator = new Box;
    segIndicator.x = sideWidth;
    segIndicator.y = topMargin;
    segIndicator.w = 2;
    segIndicator.h = segHEIGHT-segIndicator.y;
    segIndicator.fill = '#A00';

    var xml = $.ajax({
	 type: "GET",
	 url: currentXML,
	 dataType: "xml",
         global: false,
         data: "",
	 async:false,
         success: function(msg){
         }
       }).responseText;

    signalWave = [];
    signalRMS  = [];
    signalSpec = [];
    signalSpecRow = 0;
    signalSpecCol = 0;
    signalBoxes     = [];            // holds all rectangles
    signalBoxes2    = [];            // holds all rectangles
    signalIndicator = [];
    signalLabels    = [];

    signalCanvas = document.getElementById("signalCanvas");
    signalHEIGHT = signalCanvas.height;
    signalWIDTH  = signalCanvas.width;
    signalCTX    = signalCanvas.getContext('2d');

    signalIndicator = new Box;
    signalIndicator.x = sideWidth;
    signalIndicator.y = topMargin ;
    signalIndicator.w = 2;
    signalIndicator.h = signalHEIGHT-signalIndicator.y;
    signalIndicator.fill = "#A00";

    parseXML(xml);

    addSegmentation();
    addSignals();

    setInterval(draw, 100);
    setInterval(playMarker, 10);

    segCanvas.onmousedown = segMouseDown;
    signalCanvas.onmousedown = signalMouseDown;
};

function playMarker(){
    var status = $("#jquery_jplayer_1").data("jPlayer").status;
    var currentTime = status.currentTime;
}

function parseXML(xml){

    $(xml).find('segmentation').each(function(){
	$(this).find('label').each(function(){
            var label = $(this).text();
            var aEvent = new audioEvent();
            aEvent.label = label;
            segEventList.push(aEvent);
	});
	$(this).find('labelID').each(function(){
            var id = $(this).attr('idx')-1;
            segEventList[id].labelID = parseInt($(this).text());
	});
	$(this).find('startTime').each(function(){
            var id = $(this).attr('idx')-1;
            segEventList[id].start = $(this).text();
	});
	$(this).find('endTime').each(function(){
            var id = $(this).attr('idx')-1;
            segEventList[id].end = $(this).text();
	});
    });

    segLabelAmount = parseInt($(xml).find('segmentationInfo').find('labelAmount').text());

    signalWave = $(xml).find('signal').find('waveform').find('step22050').text().split(" ");
    signalRMS  = $(xml).find('signal').find('rms').find('step22050').text().split(" ");

    signalSpec = $(xml).find('signal').find('spec').find('step22050').text().split(" ");
    var tmp = $(xml).find('signal').find('spec').find('step22050').attr('size').split(" ");
    signalSpecRow = tmp[0];
    signalSpecCol = tmp[1];

    audioDuration = $(xml).find('file').find('duration').text();
}

function addSegmentation(){
    var l = segEventList.length;
    var blockH = 60;
    var lineCount = [];
    for (var i = 0; i < l; i++) {
        var posY   = 3;//3+topMargin+(segEventList[i].labelID-1)*5;//1*(blockH+5)+3+topMargin;//(segEventList[i].labelID-1)*(blockH+5)+3+topMargin;
        var startX = Math.round((segWIDTH-sideWidth)*segEventList[i].start/audioDuration+sideWidth);
        var endX   = Math.round((segWIDTH-sideWidth)*segEventList[i].end/audioDuration+sideWidth);
        var width  = endX - startX;
        var height = blockH;
        var color  = getColorBW(segEventList[i].labelID,1,segLabelAmount+3);//"#308330";
        for(var ii=0; ii < width; ii=ii+2){
            addRect(segBoxes,startX+ii,posY,2, height, color);
        }
        lineCount[segEventList[i].labelID-1] = i;
    }
    addRect(segBoxes,0,topMargin,segWIDTH,1,"#AAA");
    addRect(segBoxes,sideWidth,topMargin,1,segHEIGHT,"#AAA");
    addLabel(segLabels,5,40,"Segments","#555","10pt");
}

function addSignals(){
   var blockH = 50;
   var posY = 1*(blockH+5)+topMargin;

   addLabel(signalLabels,5,posY-20,"Waveform","#555","10pt");
   addRect(signalBoxes,0,posY, signalWIDTH, 1, "#AAA");

   var barWidth = ((signalWIDTH-sideWidth) / signalWave.length);
   for(var x = 0; x < signalWave.length; x++){
     var barHeight = Math.round(scaleRange(signalWave[x],0,100,0,blockH/2));
     addRect(signalBoxes2,Math.floor(sideWidth+(x*barWidth)),(posY-barHeight)-blockH/2-2,Math.ceil(barWidth),barHeight*2+0.5,"#000");
   }
   posY = 2*(blockH+5)+topMargin;

   addLabel(signalLabels,5,posY-20,"Energy","#555","10pt");
   addRect(signalBoxes,0,posY, signalWIDTH, 1, "#AAA");

   var barWidth2 = ((signalWIDTH-sideWidth) / signalRMS.length);
   for(var x = 0; x < signalRMS.length; x++){
     var barHeight = Math.round(scaleRange(signalRMS[x],0,100,0,blockH));
     addRect(signalBoxes2,Math.floor(sideWidth+(x*barWidth2)),(posY-barHeight)-2,Math.ceil(barWidth2),barWidth+0.5,"#AAA");
   }
   addRect(signalBoxes,0,topMargin,signalWIDTH,1,"#AAA");
   addRect(signalBoxes,sideWidth,topMargin,1,signalHEIGHT,"#AAA");

   posY = 3*(blockH+5)+topMargin;

   var cellWidth = Math.round((signalWIDTH-sideWidth) / signalSpecCol);
   var cellHeight= Math.round((blockH) / signalSpecRow);

   for(var colID = 0; colID < signalSpecCol; colID++){
      for(var rowID = 0; rowID < signalSpecRow; rowID++){
        var indexInArray = rowID+(signalSpecRow * colID);
	var colorValue = getColorJET(signalSpec[indexInArray]/100,0,1);
	addRect(signalBoxes,(sideWidth+(colID*cellWidth)),posY-blockH+(rowID*cellHeight),cellWidth,cellHeight,colorValue);
      }
   }
   addLabel(signalLabels,5,posY-20,"Spectrogram","#555","10pt");
   addRect(signalBoxes,0,posY-blockH+5+(signalSpecRow*cellHeight), signalWIDTH, 1, "#AAA");
}

//wipes the canvas context
function clear(c,w,h) {
  c.clearRect(0, 0, w,h);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function draw() {
  if (canvasValid == false){

    // =====================
    // Segmentation box
    // =====================
    clear(segCTX,segWIDTH,segHEIGHT);
    // draw all boxes
    var l = segBoxes.length;
    for (var i = 0; i < l; i++) {
        /*if(segBoxes[i].x < segIndicator.x){
            var c = new jColour(segBoxes[i].fill);
            c.transparentize(0.8);
            //var cl = Color(segBoxes[i].fill);
            //alert(segBoxes[i].fill)
            drawBox(segCTX, segBoxes[i],c.rgb());
        }else{
            */
            drawBox(segCTX, segBoxes[i], segBoxes[i].fill);
        //}
    }

    var ll = segLabels.length;
    for (var i = 0; i < ll; i++) {
        drawtext(segCTX, segLabels[i], segLabels[i].text);
    }

    // draw indicator
    drawBox(segCTX, segIndicator, segIndicator.fill);

    // =====================
    // Signal box
    // =====================
    clear(signalCTX,signalWIDTH,signalHEIGHT);
    // draw all boxes
    var l = signalBoxes.length;
    for (var i = 0; i < l; i++) {
        drawBox(signalCTX, signalBoxes[i], signalBoxes[i].fill);
    }
    var l = signalBoxes2.length;
    for (var i = 0; i < l; i++) {
        if(signalBoxes2[i].x < signalIndicator.x){
	  drawBox(signalCTX, signalBoxes2[i], "#AAA");
	}else{
	  drawBox(signalCTX, signalBoxes2[i], "#000");
	}
    }
    var ll = signalLabels.length;
    for (var i = 0; i < ll; i++) {
        drawtext(signalCTX, signalLabels[i], signalLabels[i].text);
    }
    // draw indicator
    drawBox(signalCTX, signalIndicator, signalIndicator.fill);


    canvasValid = true;
  }
}


function invalidate() {
  canvasValid = false;
}

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
function getMouse(e,canvas) {
   var element = canvas, offsetX = 0, offsetY = 0;

   if (element.offsetParent) {
     do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
   }

   // Add padding and border style widths to offset
   offsetX += stylePaddingLeft;
   offsetY += stylePaddingTop;

   offsetX += styleBorderLeft;
   offsetY += styleBorderTop;

   mx = e.pageX - offsetX;
   my = e.pageY - offsetY
}


// Mouse handling
function signalMouseDown(e){
  getMouse(e,signalCanvas);
  var pos = mx - sideWidth;
  if(pos > 0){
    pos = pos / (signalWIDTH-sideWidth)*100;
    seekAudio(pos);
  }
}
function segMouseDown(e){
  getMouse(e,segCanvas);
  var pos = mx - sideWidth;
  if(pos > 0){
    pos = pos / (segWIDTH-sideWidth)*100;
    seekAudio(pos);
  }
}

// Helper functions
function audioEvent(){
    this.start = 0;
    this.end   = 0;
    this.label = '';
    this.labelID = 0;
    this.weight = 0;
}

function Box() {
    this.x = 0;
    this.y = 0;
    this.w = 1; // default width and height?
    this.h = 1;
    this.fill = '#444444';
}

function Label(){
    this.x = 0;
    this.y = 0;
    this.size = "12pt";
    this.font = "Sans-Serif, bold"; //"Michroma"; //Sans-Serif;
    this.lineWidth = 1;
    this.strokeStyle = "black"; // stroke color
    this.text = "";
}


// Adding functions
function addLabel(list,x,y,text,strokeStyle,size){
    var lab = new Label;
    lab.x = x;
    lab.y = y;
    //lab.font = font;
    lab.size = size;
    lab.text = text;
    lab.strokeStyle = strokeStyle;
    list.push(lab);
    invalidate();
}
function addRect(list,x, y, w, h, fill) {
    var rect = new Box;
    rect.x = x;
    rect.y = y;
    rect.w = w;
    rect.h = h;
    rect.fill = fill;
    list.push(rect);
    invalidate();
}

// Drawing functions
function drawBox(context, shape, fill) { // Draws a single shape to a single context
    context.fillStyle = fill;
    // We can skip the drawing of elements that have moved off the screen:
    //if (shape.x > WIDTH || shape.y > HEIGHT) return;
    if (shape.x + shape.w < 0 || shape.y + shape.h < 0) return;

    context.fillRect(shape.x,shape.y,shape.w,shape.h);
    //context.stroke();
}
function drawtext(context,obj,text) {
    context.font = obj.size+' '+obj.font;
    context.lineWidth  = 1; //obj.lineWidth;
    context.fillStyle = obj.strokeStyle; //"#555"; // text color

    //context.strokeStyle = obj.strokeStyle; // stroke color
    context.fillText(text, obj.x, obj.y);
}


// Colormap
function scaleRange(value,oldMin,oldMax,newMin,newMax){
    return (value / ((oldMax - oldMin) / (newMax - newMin)))+newMin;
}
function RGB(rValue,gValue,bValue){
    return "rgb("+Math.round(scaleRange(rValue,0,1,0,255))+","+Math.round(scaleRange(gValue,0,1,0,255))+","+Math.round(scaleRange(bValue,0,1,0,255))+")";
}

function RGBdim(rgbValue,dimValue){
    var digits = /rgba?\((\d+), (\d+), (\d+)/.exec( rgbValue );
    //var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(rgbValue);

    var red   = parseInt(digits[1])-dimValue;
    var green = parseInt(digits[2])-dimValue;
    var blue  = parseInt(digits[3])-dimValue;

    //return "rgb("+red+","+green+","+blue+")";
    return rgbValue;
}

// Grayscale
var rArray = new Array(0,0.001001,0.002002,0.003003,0.004004,0.005005,0.006006,0.007007,0.008008,0.009009,0.01001,0.011011,0.012012,0.013013,0.014014,0.015015,0.016016,0.017017,0.018018,0.019019,0.02002,0.021021,0.022022,0.023023,0.024024,0.025025,0.026026,0.027027,0.028028,0.029029,0.03003,0.031031,0.032032,0.033033,0.034034,0.035035,0.036036,0.037037,0.038038,0.039039,0.04004,0.041041,0.042042,0.043043,0.044044,0.045045,0.046046,0.047047,0.048048,0.049049,0.05005,0.051051,0.052052,0.053053,0.054054,0.055055,0.056056,0.057057,0.058058,0.059059,0.06006,0.061061,0.062062,0.063063,0.064064,0.065065,0.066066,0.067067,0.068068,0.069069,0.07007,0.071071,0.072072,0.073073,0.074074,0.075075,0.076076,0.077077,0.078078,0.079079,0.08008,0.081081,0.082082,0.083083,0.084084,0.085085,0.086086,0.087087,0.088088,0.089089,0.09009,0.091091,0.092092,0.093093,0.094094,0.095095,0.096096,0.097097,0.098098,0.099099,0.1001,0.1011,0.1021,0.1031,0.1041,0.10511,0.10611,0.10711,0.10811,0.10911,0.11011,0.11111,0.11211,0.11311,0.11411,0.11512,0.11612,0.11712,0.11812,0.11912,0.12012,0.12112,0.12212,0.12312,0.12412,0.12513,0.12613,0.12713,0.12813,0.12913,0.13013,0.13113,0.13213,0.13313,0.13413,0.13514,0.13614,0.13714,0.13814,0.13914,0.14014,0.14114,0.14214,0.14314,0.14414,0.14515,0.14615,0.14715,0.14815,0.14915,0.15015,0.15115,0.15215,0.15315,0.15415,0.15516,0.15616,0.15716,0.15816,0.15916,0.16016,0.16116,0.16216,0.16316,0.16416,0.16517,0.16617,0.16717,0.16817,0.16917,0.17017,0.17117,0.17217,0.17317,0.17417,0.17518,0.17618,0.17718,0.17818,0.17918,0.18018,0.18118,0.18218,0.18318,0.18418,0.18519,0.18619,0.18719,0.18819,0.18919,0.19019,0.19119,0.19219,0.19319,0.19419,0.1952,0.1962,0.1972,0.1982,0.1992,0.2002,0.2012,0.2022,0.2032,0.2042,0.20521,0.20621,0.20721,0.20821,0.20921,0.21021,0.21121,0.21221,0.21321,0.21421,0.21522,0.21622,0.21722,0.21822,0.21922,0.22022,0.22122,0.22222,0.22322,0.22422,0.22523,0.22623,0.22723,0.22823,0.22923,0.23023,0.23123,0.23223,0.23323,0.23423,0.23524,0.23624,0.23724,0.23824,0.23924,0.24024,0.24124,0.24224,0.24324,0.24424,0.24525,0.24625,0.24725,0.24825,0.24925,0.25025,0.25125,0.25225,0.25325,0.25425,0.25526,0.25626,0.25726,0.25826,0.25926,0.26026,0.26126,0.26226,0.26326,0.26426,0.26527,0.26627,0.26727,0.26827,0.26927,0.27027,0.27127,0.27227,0.27327,0.27427,0.27528,0.27628,0.27728,0.27828,0.27928,0.28028,0.28128,0.28228,0.28328,0.28428,0.28529,0.28629,0.28729,0.28829,0.28929,0.29029,0.29129,0.29229,0.29329,0.29429,0.2953,0.2963,0.2973,0.2983,0.2993,0.3003,0.3013,0.3023,0.3033,0.3043,0.30531,0.30631,0.30731,0.30831,0.30931,0.31031,0.31131,0.31231,0.31331,0.31431,0.31532,0.31632,0.31732,0.31832,0.31932,0.32032,0.32132,0.32232,0.32332,0.32432,0.32533,0.32633,0.32733,0.32833,0.32933,0.33033,0.33133,0.33233,0.33333,0.33433,0.33534,0.33634,0.33734,0.33834,0.33934,0.34034,0.34134,0.34234,0.34334,0.34434,0.34535,0.34635,0.34735,0.34835,0.34935,0.35035,0.35135,0.35235,0.35335,0.35435,0.35536,0.35636,0.35736,0.35836,0.35936,0.36036,0.36136,0.36236,0.36336,0.36436,0.36537,0.36637,0.36737,0.36837,0.36937,0.37037,0.37137,0.37237,0.37337,0.37437,0.37538,0.37638,0.37738,0.37838,0.37938,0.38038,0.38138,0.38238,0.38338,0.38438,0.38539,0.38639,0.38739,0.38839,0.38939,0.39039,0.39139,0.39239,0.39339,0.39439,0.3954,0.3964,0.3974,0.3984,0.3994,0.4004,0.4014,0.4024,0.4034,0.4044,0.40541,0.40641,0.40741,0.40841,0.40941,0.41041,0.41141,0.41241,0.41341,0.41441,0.41542,0.41642,0.41742,0.41842,0.41942,0.42042,0.42142,0.42242,0.42342,0.42442,0.42543,0.42643,0.42743,0.42843,0.42943,0.43043,0.43143,0.43243,0.43343,0.43443,0.43544,0.43644,0.43744,0.43844,0.43944,0.44044,0.44144,0.44244,0.44344,0.44444,0.44545,0.44645,0.44745,0.44845,0.44945,0.45045,0.45145,0.45245,0.45345,0.45445,0.45546,0.45646,0.45746,0.45846,0.45946,0.46046,0.46146,0.46246,0.46346,0.46446,0.46547,0.46647,0.46747,0.46847,0.46947,0.47047,0.47147,0.47247,0.47347,0.47447,0.47548,0.47648,0.47748,0.47848,0.47948,0.48048,0.48148,0.48248,0.48348,0.48448,0.48549,0.48649,0.48749,0.48849,0.48949,0.49049,0.49149,0.49249,0.49349,0.49449,0.4955,0.4965,0.4975,0.4985,0.4995,0.5005,0.5015,0.5025,0.5035,0.5045,0.50551,0.50651,0.50751,0.50851,0.50951,0.51051,0.51151,0.51251,0.51351,0.51451,0.51552,0.51652,0.51752,0.51852,0.51952,0.52052,0.52152,0.52252,0.52352,0.52452,0.52553,0.52653,0.52753,0.52853,0.52953,0.53053,0.53153,0.53253,0.53353,0.53453,0.53554,0.53654,0.53754,0.53854,0.53954,0.54054,0.54154,0.54254,0.54354,0.54454,0.54555,0.54655,0.54755,0.54855,0.54955,0.55055,0.55155,0.55255,0.55355,0.55455,0.55556,0.55656,0.55756,0.55856,0.55956,0.56056,0.56156,0.56256,0.56356,0.56456,0.56557,0.56657,0.56757,0.56857,0.56957,0.57057,0.57157,0.57257,0.57357,0.57457,0.57558,0.57658,0.57758,0.57858,0.57958,0.58058,0.58158,0.58258,0.58358,0.58458,0.58559,0.58659,0.58759,0.58859,0.58959,0.59059,0.59159,0.59259,0.59359,0.59459,0.5956,0.5966,0.5976,0.5986,0.5996,0.6006,0.6016,0.6026,0.6036,0.6046,0.60561,0.60661,0.60761,0.60861,0.60961,0.61061,0.61161,0.61261,0.61361,0.61461,0.61562,0.61662,0.61762,0.61862,0.61962,0.62062,0.62162,0.62262,0.62362,0.62462,0.62563,0.62663,0.62763,0.62863,0.62963,0.63063,0.63163,0.63263,0.63363,0.63463,0.63564,0.63664,0.63764,0.63864,0.63964,0.64064,0.64164,0.64264,0.64364,0.64464,0.64565,0.64665,0.64765,0.64865,0.64965,0.65065,0.65165,0.65265,0.65365,0.65465,0.65566,0.65666,0.65766,0.65866,0.65966,0.66066,0.66166,0.66266,0.66366,0.66466,0.66567,0.66667,0.66767,0.66867,0.66967,0.67067,0.67167,0.67267,0.67367,0.67467,0.67568,0.67668,0.67768,0.67868,0.67968,0.68068,0.68168,0.68268,0.68368,0.68468,0.68569,0.68669,0.68769,0.68869,0.68969,0.69069,0.69169,0.69269,0.69369,0.69469,0.6957,0.6967,0.6977,0.6987,0.6997,0.7007,0.7017,0.7027,0.7037,0.7047,0.70571,0.70671,0.70771,0.70871,0.70971,0.71071,0.71171,0.71271,0.71371,0.71471,0.71572,0.71672,0.71772,0.71872,0.71972,0.72072,0.72172,0.72272,0.72372,0.72472,0.72573,0.72673,0.72773,0.72873,0.72973,0.73073,0.73173,0.73273,0.73373,0.73473,0.73574,0.73674,0.73774,0.73874,0.73974,0.74074,0.74174,0.74274,0.74374,0.74474,0.74575,0.74675,0.74775,0.74875,0.74975,0.75075,0.75175,0.75275,0.75375,0.75475,0.75576,0.75676,0.75776,0.75876,0.75976,0.76076,0.76176,0.76276,0.76376,0.76476,0.76577,0.76677,0.76777,0.76877,0.76977,0.77077,0.77177,0.77277,0.77377,0.77477,0.77578,0.77678,0.77778,0.77878,0.77978,0.78078,0.78178,0.78278,0.78378,0.78478,0.78579,0.78679,0.78779,0.78879,0.78979,0.79079,0.79179,0.79279,0.79379,0.79479,0.7958,0.7968,0.7978,0.7988,0.7998,0.8008,0.8018,0.8028,0.8038,0.8048,0.80581,0.80681,0.80781,0.80881,0.80981,0.81081,0.81181,0.81281,0.81381,0.81481,0.81582,0.81682,0.81782,0.81882,0.81982,0.82082,0.82182,0.82282,0.82382,0.82482,0.82583,0.82683,0.82783,0.82883,0.82983,0.83083,0.83183,0.83283,0.83383,0.83483,0.83584,0.83684,0.83784,0.83884,0.83984,0.84084,0.84184,0.84284,0.84384,0.84484,0.84585,0.84685,0.84785,0.84885,0.84985,0.85085,0.85185,0.85285,0.85385,0.85485,0.85586,0.85686,0.85786,0.85886,0.85986,0.86086,0.86186,0.86286,0.86386,0.86486,0.86587,0.86687,0.86787,0.86887,0.86987,0.87087,0.87187,0.87287,0.87387,0.87487,0.87588,0.87688,0.87788,0.87888,0.87988,0.88088,0.88188,0.88288,0.88388,0.88488,0.88589,0.88689,0.88789,0.88889,0.88989,0.89089,0.89189,0.89289,0.89389,0.89489,0.8959,0.8969,0.8979,0.8989,0.8999,0.9009,0.9019,0.9029,0.9039,0.9049,0.90591,0.90691,0.90791,0.90891,0.90991,0.91091,0.91191,0.91291,0.91391,0.91491,0.91592,0.91692,0.91792,0.91892,0.91992,0.92092,0.92192,0.92292,0.92392,0.92492,0.92593,0.92693,0.92793,0.92893,0.92993,0.93093,0.93193,0.93293,0.93393,0.93493,0.93594,0.93694,0.93794,0.93894,0.93994,0.94094,0.94194,0.94294,0.94394,0.94494,0.94595,0.94695,0.94795,0.94895,0.94995,0.95095,0.95195,0.95295,0.95395,0.95495,0.95596,0.95696,0.95796,0.95896,0.95996,0.96096,0.96196,0.96296,0.96396,0.96496,0.96597,0.96697,0.96797,0.96897,0.96997,0.97097,0.97197,0.97297,0.97397,0.97497,0.97598,0.97698,0.97798,0.97898,0.97998,0.98098,0.98198,0.98298,0.98398,0.98498,0.98599,0.98699,0.98799,0.98899,0.98999,0.99099,0.99199,0.99299,0.99399,0.99499,0.996,0.997,0.998,0.999,1);
var gArray = new Array(0,0.001001,0.002002,0.003003,0.004004,0.005005,0.006006,0.007007,0.008008,0.009009,0.01001,0.011011,0.012012,0.013013,0.014014,0.015015,0.016016,0.017017,0.018018,0.019019,0.02002,0.021021,0.022022,0.023023,0.024024,0.025025,0.026026,0.027027,0.028028,0.029029,0.03003,0.031031,0.032032,0.033033,0.034034,0.035035,0.036036,0.037037,0.038038,0.039039,0.04004,0.041041,0.042042,0.043043,0.044044,0.045045,0.046046,0.047047,0.048048,0.049049,0.05005,0.051051,0.052052,0.053053,0.054054,0.055055,0.056056,0.057057,0.058058,0.059059,0.06006,0.061061,0.062062,0.063063,0.064064,0.065065,0.066066,0.067067,0.068068,0.069069,0.07007,0.071071,0.072072,0.073073,0.074074,0.075075,0.076076,0.077077,0.078078,0.079079,0.08008,0.081081,0.082082,0.083083,0.084084,0.085085,0.086086,0.087087,0.088088,0.089089,0.09009,0.091091,0.092092,0.093093,0.094094,0.095095,0.096096,0.097097,0.098098,0.099099,0.1001,0.1011,0.1021,0.1031,0.1041,0.10511,0.10611,0.10711,0.10811,0.10911,0.11011,0.11111,0.11211,0.11311,0.11411,0.11512,0.11612,0.11712,0.11812,0.11912,0.12012,0.12112,0.12212,0.12312,0.12412,0.12513,0.12613,0.12713,0.12813,0.12913,0.13013,0.13113,0.13213,0.13313,0.13413,0.13514,0.13614,0.13714,0.13814,0.13914,0.14014,0.14114,0.14214,0.14314,0.14414,0.14515,0.14615,0.14715,0.14815,0.14915,0.15015,0.15115,0.15215,0.15315,0.15415,0.15516,0.15616,0.15716,0.15816,0.15916,0.16016,0.16116,0.16216,0.16316,0.16416,0.16517,0.16617,0.16717,0.16817,0.16917,0.17017,0.17117,0.17217,0.17317,0.17417,0.17518,0.17618,0.17718,0.17818,0.17918,0.18018,0.18118,0.18218,0.18318,0.18418,0.18519,0.18619,0.18719,0.18819,0.18919,0.19019,0.19119,0.19219,0.19319,0.19419,0.1952,0.1962,0.1972,0.1982,0.1992,0.2002,0.2012,0.2022,0.2032,0.2042,0.20521,0.20621,0.20721,0.20821,0.20921,0.21021,0.21121,0.21221,0.21321,0.21421,0.21522,0.21622,0.21722,0.21822,0.21922,0.22022,0.22122,0.22222,0.22322,0.22422,0.22523,0.22623,0.22723,0.22823,0.22923,0.23023,0.23123,0.23223,0.23323,0.23423,0.23524,0.23624,0.23724,0.23824,0.23924,0.24024,0.24124,0.24224,0.24324,0.24424,0.24525,0.24625,0.24725,0.24825,0.24925,0.25025,0.25125,0.25225,0.25325,0.25425,0.25526,0.25626,0.25726,0.25826,0.25926,0.26026,0.26126,0.26226,0.26326,0.26426,0.26527,0.26627,0.26727,0.26827,0.26927,0.27027,0.27127,0.27227,0.27327,0.27427,0.27528,0.27628,0.27728,0.27828,0.27928,0.28028,0.28128,0.28228,0.28328,0.28428,0.28529,0.28629,0.28729,0.28829,0.28929,0.29029,0.29129,0.29229,0.29329,0.29429,0.2953,0.2963,0.2973,0.2983,0.2993,0.3003,0.3013,0.3023,0.3033,0.3043,0.30531,0.30631,0.30731,0.30831,0.30931,0.31031,0.31131,0.31231,0.31331,0.31431,0.31532,0.31632,0.31732,0.31832,0.31932,0.32032,0.32132,0.32232,0.32332,0.32432,0.32533,0.32633,0.32733,0.32833,0.32933,0.33033,0.33133,0.33233,0.33333,0.33433,0.33534,0.33634,0.33734,0.33834,0.33934,0.34034,0.34134,0.34234,0.34334,0.34434,0.34535,0.34635,0.34735,0.34835,0.34935,0.35035,0.35135,0.35235,0.35335,0.35435,0.35536,0.35636,0.35736,0.35836,0.35936,0.36036,0.36136,0.36236,0.36336,0.36436,0.36537,0.36637,0.36737,0.36837,0.36937,0.37037,0.37137,0.37237,0.37337,0.37437,0.37538,0.37638,0.37738,0.37838,0.37938,0.38038,0.38138,0.38238,0.38338,0.38438,0.38539,0.38639,0.38739,0.38839,0.38939,0.39039,0.39139,0.39239,0.39339,0.39439,0.3954,0.3964,0.3974,0.3984,0.3994,0.4004,0.4014,0.4024,0.4034,0.4044,0.40541,0.40641,0.40741,0.40841,0.40941,0.41041,0.41141,0.41241,0.41341,0.41441,0.41542,0.41642,0.41742,0.41842,0.41942,0.42042,0.42142,0.42242,0.42342,0.42442,0.42543,0.42643,0.42743,0.42843,0.42943,0.43043,0.43143,0.43243,0.43343,0.43443,0.43544,0.43644,0.43744,0.43844,0.43944,0.44044,0.44144,0.44244,0.44344,0.44444,0.44545,0.44645,0.44745,0.44845,0.44945,0.45045,0.45145,0.45245,0.45345,0.45445,0.45546,0.45646,0.45746,0.45846,0.45946,0.46046,0.46146,0.46246,0.46346,0.46446,0.46547,0.46647,0.46747,0.46847,0.46947,0.47047,0.47147,0.47247,0.47347,0.47447,0.47548,0.47648,0.47748,0.47848,0.47948,0.48048,0.48148,0.48248,0.48348,0.48448,0.48549,0.48649,0.48749,0.48849,0.48949,0.49049,0.49149,0.49249,0.49349,0.49449,0.4955,0.4965,0.4975,0.4985,0.4995,0.5005,0.5015,0.5025,0.5035,0.5045,0.50551,0.50651,0.50751,0.50851,0.50951,0.51051,0.51151,0.51251,0.51351,0.51451,0.51552,0.51652,0.51752,0.51852,0.51952,0.52052,0.52152,0.52252,0.52352,0.52452,0.52553,0.52653,0.52753,0.52853,0.52953,0.53053,0.53153,0.53253,0.53353,0.53453,0.53554,0.53654,0.53754,0.53854,0.53954,0.54054,0.54154,0.54254,0.54354,0.54454,0.54555,0.54655,0.54755,0.54855,0.54955,0.55055,0.55155,0.55255,0.55355,0.55455,0.55556,0.55656,0.55756,0.55856,0.55956,0.56056,0.56156,0.56256,0.56356,0.56456,0.56557,0.56657,0.56757,0.56857,0.56957,0.57057,0.57157,0.57257,0.57357,0.57457,0.57558,0.57658,0.57758,0.57858,0.57958,0.58058,0.58158,0.58258,0.58358,0.58458,0.58559,0.58659,0.58759,0.58859,0.58959,0.59059,0.59159,0.59259,0.59359,0.59459,0.5956,0.5966,0.5976,0.5986,0.5996,0.6006,0.6016,0.6026,0.6036,0.6046,0.60561,0.60661,0.60761,0.60861,0.60961,0.61061,0.61161,0.61261,0.61361,0.61461,0.61562,0.61662,0.61762,0.61862,0.61962,0.62062,0.62162,0.62262,0.62362,0.62462,0.62563,0.62663,0.62763,0.62863,0.62963,0.63063,0.63163,0.63263,0.63363,0.63463,0.63564,0.63664,0.63764,0.63864,0.63964,0.64064,0.64164,0.64264,0.64364,0.64464,0.64565,0.64665,0.64765,0.64865,0.64965,0.65065,0.65165,0.65265,0.65365,0.65465,0.65566,0.65666,0.65766,0.65866,0.65966,0.66066,0.66166,0.66266,0.66366,0.66466,0.66567,0.66667,0.66767,0.66867,0.66967,0.67067,0.67167,0.67267,0.67367,0.67467,0.67568,0.67668,0.67768,0.67868,0.67968,0.68068,0.68168,0.68268,0.68368,0.68468,0.68569,0.68669,0.68769,0.68869,0.68969,0.69069,0.69169,0.69269,0.69369,0.69469,0.6957,0.6967,0.6977,0.6987,0.6997,0.7007,0.7017,0.7027,0.7037,0.7047,0.70571,0.70671,0.70771,0.70871,0.70971,0.71071,0.71171,0.71271,0.71371,0.71471,0.71572,0.71672,0.71772,0.71872,0.71972,0.72072,0.72172,0.72272,0.72372,0.72472,0.72573,0.72673,0.72773,0.72873,0.72973,0.73073,0.73173,0.73273,0.73373,0.73473,0.73574,0.73674,0.73774,0.73874,0.73974,0.74074,0.74174,0.74274,0.74374,0.74474,0.74575,0.74675,0.74775,0.74875,0.74975,0.75075,0.75175,0.75275,0.75375,0.75475,0.75576,0.75676,0.75776,0.75876,0.75976,0.76076,0.76176,0.76276,0.76376,0.76476,0.76577,0.76677,0.76777,0.76877,0.76977,0.77077,0.77177,0.77277,0.77377,0.77477,0.77578,0.77678,0.77778,0.77878,0.77978,0.78078,0.78178,0.78278,0.78378,0.78478,0.78579,0.78679,0.78779,0.78879,0.78979,0.79079,0.79179,0.79279,0.79379,0.79479,0.7958,0.7968,0.7978,0.7988,0.7998,0.8008,0.8018,0.8028,0.8038,0.8048,0.80581,0.80681,0.80781,0.80881,0.80981,0.81081,0.81181,0.81281,0.81381,0.81481,0.81582,0.81682,0.81782,0.81882,0.81982,0.82082,0.82182,0.82282,0.82382,0.82482,0.82583,0.82683,0.82783,0.82883,0.82983,0.83083,0.83183,0.83283,0.83383,0.83483,0.83584,0.83684,0.83784,0.83884,0.83984,0.84084,0.84184,0.84284,0.84384,0.84484,0.84585,0.84685,0.84785,0.84885,0.84985,0.85085,0.85185,0.85285,0.85385,0.85485,0.85586,0.85686,0.85786,0.85886,0.85986,0.86086,0.86186,0.86286,0.86386,0.86486,0.86587,0.86687,0.86787,0.86887,0.86987,0.87087,0.87187,0.87287,0.87387,0.87487,0.87588,0.87688,0.87788,0.87888,0.87988,0.88088,0.88188,0.88288,0.88388,0.88488,0.88589,0.88689,0.88789,0.88889,0.88989,0.89089,0.89189,0.89289,0.89389,0.89489,0.8959,0.8969,0.8979,0.8989,0.8999,0.9009,0.9019,0.9029,0.9039,0.9049,0.90591,0.90691,0.90791,0.90891,0.90991,0.91091,0.91191,0.91291,0.91391,0.91491,0.91592,0.91692,0.91792,0.91892,0.91992,0.92092,0.92192,0.92292,0.92392,0.92492,0.92593,0.92693,0.92793,0.92893,0.92993,0.93093,0.93193,0.93293,0.93393,0.93493,0.93594,0.93694,0.93794,0.93894,0.93994,0.94094,0.94194,0.94294,0.94394,0.94494,0.94595,0.94695,0.94795,0.94895,0.94995,0.95095,0.95195,0.95295,0.95395,0.95495,0.95596,0.95696,0.95796,0.95896,0.95996,0.96096,0.96196,0.96296,0.96396,0.96496,0.96597,0.96697,0.96797,0.96897,0.96997,0.97097,0.97197,0.97297,0.97397,0.97497,0.97598,0.97698,0.97798,0.97898,0.97998,0.98098,0.98198,0.98298,0.98398,0.98498,0.98599,0.98699,0.98799,0.98899,0.98999,0.99099,0.99199,0.99299,0.99399,0.99499,0.996,0.997,0.998,0.999,1);
var bArray = new Array(0,0.001001,0.002002,0.003003,0.004004,0.005005,0.006006,0.007007,0.008008,0.009009,0.01001,0.011011,0.012012,0.013013,0.014014,0.015015,0.016016,0.017017,0.018018,0.019019,0.02002,0.021021,0.022022,0.023023,0.024024,0.025025,0.026026,0.027027,0.028028,0.029029,0.03003,0.031031,0.032032,0.033033,0.034034,0.035035,0.036036,0.037037,0.038038,0.039039,0.04004,0.041041,0.042042,0.043043,0.044044,0.045045,0.046046,0.047047,0.048048,0.049049,0.05005,0.051051,0.052052,0.053053,0.054054,0.055055,0.056056,0.057057,0.058058,0.059059,0.06006,0.061061,0.062062,0.063063,0.064064,0.065065,0.066066,0.067067,0.068068,0.069069,0.07007,0.071071,0.072072,0.073073,0.074074,0.075075,0.076076,0.077077,0.078078,0.079079,0.08008,0.081081,0.082082,0.083083,0.084084,0.085085,0.086086,0.087087,0.088088,0.089089,0.09009,0.091091,0.092092,0.093093,0.094094,0.095095,0.096096,0.097097,0.098098,0.099099,0.1001,0.1011,0.1021,0.1031,0.1041,0.10511,0.10611,0.10711,0.10811,0.10911,0.11011,0.11111,0.11211,0.11311,0.11411,0.11512,0.11612,0.11712,0.11812,0.11912,0.12012,0.12112,0.12212,0.12312,0.12412,0.12513,0.12613,0.12713,0.12813,0.12913,0.13013,0.13113,0.13213,0.13313,0.13413,0.13514,0.13614,0.13714,0.13814,0.13914,0.14014,0.14114,0.14214,0.14314,0.14414,0.14515,0.14615,0.14715,0.14815,0.14915,0.15015,0.15115,0.15215,0.15315,0.15415,0.15516,0.15616,0.15716,0.15816,0.15916,0.16016,0.16116,0.16216,0.16316,0.16416,0.16517,0.16617,0.16717,0.16817,0.16917,0.17017,0.17117,0.17217,0.17317,0.17417,0.17518,0.17618,0.17718,0.17818,0.17918,0.18018,0.18118,0.18218,0.18318,0.18418,0.18519,0.18619,0.18719,0.18819,0.18919,0.19019,0.19119,0.19219,0.19319,0.19419,0.1952,0.1962,0.1972,0.1982,0.1992,0.2002,0.2012,0.2022,0.2032,0.2042,0.20521,0.20621,0.20721,0.20821,0.20921,0.21021,0.21121,0.21221,0.21321,0.21421,0.21522,0.21622,0.21722,0.21822,0.21922,0.22022,0.22122,0.22222,0.22322,0.22422,0.22523,0.22623,0.22723,0.22823,0.22923,0.23023,0.23123,0.23223,0.23323,0.23423,0.23524,0.23624,0.23724,0.23824,0.23924,0.24024,0.24124,0.24224,0.24324,0.24424,0.24525,0.24625,0.24725,0.24825,0.24925,0.25025,0.25125,0.25225,0.25325,0.25425,0.25526,0.25626,0.25726,0.25826,0.25926,0.26026,0.26126,0.26226,0.26326,0.26426,0.26527,0.26627,0.26727,0.26827,0.26927,0.27027,0.27127,0.27227,0.27327,0.27427,0.27528,0.27628,0.27728,0.27828,0.27928,0.28028,0.28128,0.28228,0.28328,0.28428,0.28529,0.28629,0.28729,0.28829,0.28929,0.29029,0.29129,0.29229,0.29329,0.29429,0.2953,0.2963,0.2973,0.2983,0.2993,0.3003,0.3013,0.3023,0.3033,0.3043,0.30531,0.30631,0.30731,0.30831,0.30931,0.31031,0.31131,0.31231,0.31331,0.31431,0.31532,0.31632,0.31732,0.31832,0.31932,0.32032,0.32132,0.32232,0.32332,0.32432,0.32533,0.32633,0.32733,0.32833,0.32933,0.33033,0.33133,0.33233,0.33333,0.33433,0.33534,0.33634,0.33734,0.33834,0.33934,0.34034,0.34134,0.34234,0.34334,0.34434,0.34535,0.34635,0.34735,0.34835,0.34935,0.35035,0.35135,0.35235,0.35335,0.35435,0.35536,0.35636,0.35736,0.35836,0.35936,0.36036,0.36136,0.36236,0.36336,0.36436,0.36537,0.36637,0.36737,0.36837,0.36937,0.37037,0.37137,0.37237,0.37337,0.37437,0.37538,0.37638,0.37738,0.37838,0.37938,0.38038,0.38138,0.38238,0.38338,0.38438,0.38539,0.38639,0.38739,0.38839,0.38939,0.39039,0.39139,0.39239,0.39339,0.39439,0.3954,0.3964,0.3974,0.3984,0.3994,0.4004,0.4014,0.4024,0.4034,0.4044,0.40541,0.40641,0.40741,0.40841,0.40941,0.41041,0.41141,0.41241,0.41341,0.41441,0.41542,0.41642,0.41742,0.41842,0.41942,0.42042,0.42142,0.42242,0.42342,0.42442,0.42543,0.42643,0.42743,0.42843,0.42943,0.43043,0.43143,0.43243,0.43343,0.43443,0.43544,0.43644,0.43744,0.43844,0.43944,0.44044,0.44144,0.44244,0.44344,0.44444,0.44545,0.44645,0.44745,0.44845,0.44945,0.45045,0.45145,0.45245,0.45345,0.45445,0.45546,0.45646,0.45746,0.45846,0.45946,0.46046,0.46146,0.46246,0.46346,0.46446,0.46547,0.46647,0.46747,0.46847,0.46947,0.47047,0.47147,0.47247,0.47347,0.47447,0.47548,0.47648,0.47748,0.47848,0.47948,0.48048,0.48148,0.48248,0.48348,0.48448,0.48549,0.48649,0.48749,0.48849,0.48949,0.49049,0.49149,0.49249,0.49349,0.49449,0.4955,0.4965,0.4975,0.4985,0.4995,0.5005,0.5015,0.5025,0.5035,0.5045,0.50551,0.50651,0.50751,0.50851,0.50951,0.51051,0.51151,0.51251,0.51351,0.51451,0.51552,0.51652,0.51752,0.51852,0.51952,0.52052,0.52152,0.52252,0.52352,0.52452,0.52553,0.52653,0.52753,0.52853,0.52953,0.53053,0.53153,0.53253,0.53353,0.53453,0.53554,0.53654,0.53754,0.53854,0.53954,0.54054,0.54154,0.54254,0.54354,0.54454,0.54555,0.54655,0.54755,0.54855,0.54955,0.55055,0.55155,0.55255,0.55355,0.55455,0.55556,0.55656,0.55756,0.55856,0.55956,0.56056,0.56156,0.56256,0.56356,0.56456,0.56557,0.56657,0.56757,0.56857,0.56957,0.57057,0.57157,0.57257,0.57357,0.57457,0.57558,0.57658,0.57758,0.57858,0.57958,0.58058,0.58158,0.58258,0.58358,0.58458,0.58559,0.58659,0.58759,0.58859,0.58959,0.59059,0.59159,0.59259,0.59359,0.59459,0.5956,0.5966,0.5976,0.5986,0.5996,0.6006,0.6016,0.6026,0.6036,0.6046,0.60561,0.60661,0.60761,0.60861,0.60961,0.61061,0.61161,0.61261,0.61361,0.61461,0.61562,0.61662,0.61762,0.61862,0.61962,0.62062,0.62162,0.62262,0.62362,0.62462,0.62563,0.62663,0.62763,0.62863,0.62963,0.63063,0.63163,0.63263,0.63363,0.63463,0.63564,0.63664,0.63764,0.63864,0.63964,0.64064,0.64164,0.64264,0.64364,0.64464,0.64565,0.64665,0.64765,0.64865,0.64965,0.65065,0.65165,0.65265,0.65365,0.65465,0.65566,0.65666,0.65766,0.65866,0.65966,0.66066,0.66166,0.66266,0.66366,0.66466,0.66567,0.66667,0.66767,0.66867,0.66967,0.67067,0.67167,0.67267,0.67367,0.67467,0.67568,0.67668,0.67768,0.67868,0.67968,0.68068,0.68168,0.68268,0.68368,0.68468,0.68569,0.68669,0.68769,0.68869,0.68969,0.69069,0.69169,0.69269,0.69369,0.69469,0.6957,0.6967,0.6977,0.6987,0.6997,0.7007,0.7017,0.7027,0.7037,0.7047,0.70571,0.70671,0.70771,0.70871,0.70971,0.71071,0.71171,0.71271,0.71371,0.71471,0.71572,0.71672,0.71772,0.71872,0.71972,0.72072,0.72172,0.72272,0.72372,0.72472,0.72573,0.72673,0.72773,0.72873,0.72973,0.73073,0.73173,0.73273,0.73373,0.73473,0.73574,0.73674,0.73774,0.73874,0.73974,0.74074,0.74174,0.74274,0.74374,0.74474,0.74575,0.74675,0.74775,0.74875,0.74975,0.75075,0.75175,0.75275,0.75375,0.75475,0.75576,0.75676,0.75776,0.75876,0.75976,0.76076,0.76176,0.76276,0.76376,0.76476,0.76577,0.76677,0.76777,0.76877,0.76977,0.77077,0.77177,0.77277,0.77377,0.77477,0.77578,0.77678,0.77778,0.77878,0.77978,0.78078,0.78178,0.78278,0.78378,0.78478,0.78579,0.78679,0.78779,0.78879,0.78979,0.79079,0.79179,0.79279,0.79379,0.79479,0.7958,0.7968,0.7978,0.7988,0.7998,0.8008,0.8018,0.8028,0.8038,0.8048,0.80581,0.80681,0.80781,0.80881,0.80981,0.81081,0.81181,0.81281,0.81381,0.81481,0.81582,0.81682,0.81782,0.81882,0.81982,0.82082,0.82182,0.82282,0.82382,0.82482,0.82583,0.82683,0.82783,0.82883,0.82983,0.83083,0.83183,0.83283,0.83383,0.83483,0.83584,0.83684,0.83784,0.83884,0.83984,0.84084,0.84184,0.84284,0.84384,0.84484,0.84585,0.84685,0.84785,0.84885,0.84985,0.85085,0.85185,0.85285,0.85385,0.85485,0.85586,0.85686,0.85786,0.85886,0.85986,0.86086,0.86186,0.86286,0.86386,0.86486,0.86587,0.86687,0.86787,0.86887,0.86987,0.87087,0.87187,0.87287,0.87387,0.87487,0.87588,0.87688,0.87788,0.87888,0.87988,0.88088,0.88188,0.88288,0.88388,0.88488,0.88589,0.88689,0.88789,0.88889,0.88989,0.89089,0.89189,0.89289,0.89389,0.89489,0.8959,0.8969,0.8979,0.8989,0.8999,0.9009,0.9019,0.9029,0.9039,0.9049,0.90591,0.90691,0.90791,0.90891,0.90991,0.91091,0.91191,0.91291,0.91391,0.91491,0.91592,0.91692,0.91792,0.91892,0.91992,0.92092,0.92192,0.92292,0.92392,0.92492,0.92593,0.92693,0.92793,0.92893,0.92993,0.93093,0.93193,0.93293,0.93393,0.93493,0.93594,0.93694,0.93794,0.93894,0.93994,0.94094,0.94194,0.94294,0.94394,0.94494,0.94595,0.94695,0.94795,0.94895,0.94995,0.95095,0.95195,0.95295,0.95395,0.95495,0.95596,0.95696,0.95796,0.95896,0.95996,0.96096,0.96196,0.96296,0.96396,0.96496,0.96597,0.96697,0.96797,0.96897,0.96997,0.97097,0.97197,0.97297,0.97397,0.97497,0.97598,0.97698,0.97798,0.97898,0.97998,0.98098,0.98198,0.98298,0.98398,0.98498,0.98599,0.98699,0.98799,0.98899,0.98999,0.99099,0.99199,0.99299,0.99399,0.99499,0.996,0.997,0.998,0.999,1);

function getColorBW(value, minValue, maxValue){
    var index = Math.round(scaleRange(value,minValue,maxValue,0,999));
    return RGB(rArray[index], gArray[index], bArray[index]);
}

// Jet colormap
var rArray2 = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.004, 0.008, 0.012, 0.016, 0.02, 0.024, 0.028, 0.032, 0.036, 0.04, 0.044, 0.048, 0.052, 0.056, 0.06, 0.064, 0.068, 0.072, 0.076, 0.08, 0.084, 0.088, 0.092, 0.096, 0.1, 0.104, 0.108, 0.112, 0.116, 0.12, 0.124, 0.128, 0.132, 0.136, 0.14, 0.144, 0.148, 0.152, 0.156, 0.16, 0.164, 0.168, 0.172, 0.176, 0.18, 0.184, 0.188, 0.192, 0.196, 0.2, 0.204, 0.208, 0.212, 0.216, 0.22, 0.224, 0.228, 0.232, 0.236, 0.24, 0.244, 0.248, 0.252, 0.256, 0.26, 0.264, 0.268, 0.272, 0.276, 0.28, 0.284, 0.288, 0.292, 0.296, 0.3, 0.304, 0.308, 0.312, 0.316, 0.32, 0.324, 0.328, 0.332, 0.336, 0.34, 0.344, 0.348, 0.352, 0.356, 0.36, 0.364, 0.368, 0.372, 0.376, 0.38, 0.384, 0.388, 0.392, 0.396, 0.4, 0.404, 0.408, 0.412, 0.416, 0.42, 0.424, 0.428, 0.432, 0.436, 0.44, 0.444, 0.448, 0.452, 0.456, 0.46, 0.464, 0.468, 0.472, 0.476, 0.48, 0.484, 0.488, 0.492, 0.496, 0.5, 0.504, 0.508, 0.512, 0.516, 0.52, 0.524, 0.528, 0.532, 0.536, 0.54, 0.544, 0.548, 0.552, 0.556, 0.56, 0.564, 0.568, 0.572, 0.576, 0.58, 0.584, 0.588, 0.592, 0.596, 0.6, 0.604, 0.608, 0.612, 0.616, 0.62, 0.624, 0.628, 0.632, 0.636, 0.64, 0.644, 0.648, 0.652, 0.656, 0.66, 0.664, 0.668, 0.672, 0.676, 0.68, 0.684, 0.688, 0.692, 0.696, 0.7, 0.704, 0.708, 0.712, 0.716, 0.72, 0.724, 0.728, 0.732, 0.736, 0.74, 0.744, 0.748, 0.752, 0.756, 0.76, 0.764, 0.768, 0.772, 0.776, 0.78, 0.784, 0.788, 0.792, 0.796, 0.8, 0.804, 0.808, 0.812, 0.816, 0.82, 0.824, 0.828, 0.832, 0.836, 0.84, 0.844, 0.848, 0.852, 0.856, 0.86, 0.864, 0.868, 0.872, 0.876, 0.88, 0.884, 0.888, 0.892, 0.896, 0.9, 0.904, 0.908, 0.912, 0.916, 0.92, 0.924, 0.928, 0.932, 0.936, 0.94, 0.944, 0.948, 0.952, 0.956, 0.96, 0.964, 0.968, 0.972, 0.976, 0.98, 0.984, 0.988, 0.992, 0.996, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.996, 0.992, 0.988, 0.984, 0.98, 0.976, 0.972, 0.968, 0.964, 0.96, 0.956, 0.952, 0.948, 0.944, 0.94, 0.936, 0.932, 0.928, 0.924, 0.92, 0.916, 0.912, 0.908, 0.904, 0.9, 0.896, 0.892, 0.888, 0.884, 0.88, 0.876, 0.872, 0.868, 0.864, 0.86, 0.856, 0.852, 0.848, 0.844, 0.84, 0.836, 0.832, 0.828, 0.824, 0.82, 0.816, 0.812, 0.808, 0.804, 0.8, 0.796, 0.792, 0.788, 0.784, 0.78, 0.776, 0.772, 0.768, 0.764, 0.76, 0.756, 0.752, 0.748, 0.744, 0.74, 0.736, 0.732, 0.728, 0.724, 0.72, 0.716, 0.712, 0.708, 0.704, 0.7, 0.696, 0.692, 0.688, 0.684, 0.68, 0.676, 0.672, 0.668, 0.664, 0.66, 0.656, 0.652, 0.648, 0.644, 0.64, 0.636, 0.632, 0.628, 0.624, 0.62, 0.616, 0.612, 0.608, 0.604, 0.6, 0.596, 0.592, 0.588, 0.584, 0.58, 0.576, 0.572, 0.568, 0.564, 0.56, 0.556, 0.552, 0.548, 0.544, 0.54, 0.536, 0.532, 0.528, 0.524, 0.52, 0.516, 0.512, 0.508, 0.504, 0.5);
var gArray2 = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.004,0.008,0.012,0.016,0.02,0.024,0.028,0.032,0.036,0.04,0.044,0.048,0.052,0.056,0.06,0.064,0.068,0.072,0.076,0.08,0.084,0.088,0.092,0.096,0.1,0.104,0.108,0.112,0.116,0.12,0.124,0.128,0.132,0.136,0.14,0.144,0.148,0.152,0.156,0.16,0.164,0.168,0.172,0.176,0.18,0.184,0.188,0.192,0.196,0.2,0.204,0.208,0.212,0.216,0.22,0.224,0.228,0.232,0.236,0.24,0.244,0.248,0.252,0.256,0.26,0.264,0.268,0.272,0.276,0.28,0.284,0.288,0.292,0.296,0.3,0.304,0.308,0.312,0.316,0.32,0.324,0.328,0.332,0.336,0.34,0.344,0.348,0.352,0.356,0.36,0.364,0.368,0.372,0.376,0.38,0.384,0.388,0.392,0.396,0.4,0.404,0.408,0.412,0.416,0.42,0.424,0.428,0.432,0.436,0.44,0.444,0.448,0.452,0.456,0.46,0.464,0.468,0.472,0.476,0.48,0.484,0.488,0.492,0.496,0.5,0.504,0.508,0.512,0.516,0.52,0.524,0.528,0.532,0.536,0.54,0.544,0.548,0.552,0.556,0.56,0.564,0.568,0.572,0.576,0.58,0.584,0.588,0.592,0.596,0.6,0.604,0.608,0.612,0.616,0.62,0.624,0.628,0.632,0.636,0.64,0.644,0.648,0.652,0.656,0.66,0.664,0.668,0.672,0.676,0.68,0.684,0.688,0.692,0.696,0.7,0.704,0.708,0.712,0.716,0.72,0.724,0.728,0.732,0.736,0.74,0.744,0.748,0.752,0.756,0.76,0.764,0.768,0.772,0.776,0.78,0.784,0.788,0.792,0.796,0.8,0.804,0.808,0.812,0.816,0.82,0.824,0.828,0.832,0.836,0.84,0.844,0.848,0.852,0.856,0.86,0.864,0.868,0.872,0.876,0.88,0.884,0.888,0.892,0.896,0.9,0.904,0.908,0.912,0.916,0.92,0.924,0.928,0.932,0.936,0.94,0.944,0.948,0.952,0.956,0.96,0.964,0.968,0.972,0.976,0.98,0.984,0.988,0.992,0.996,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.996,0.992,0.988,0.984,0.98,0.976,0.972,0.968,0.964,0.96,0.956,0.952,0.948,0.944,0.94,0.936,0.932,0.928,0.924,0.92,0.916,0.912,0.908,0.904,0.9,0.896,0.892,0.888,0.884,0.88,0.876,0.872,0.868,0.864,0.86,0.856,0.852,0.848,0.844,0.84,0.836,0.832,0.828,0.824,0.82,0.816,0.812,0.808,0.804,0.8,0.796,0.792,0.788,0.784,0.78,0.776,0.772,0.768,0.764,0.76,0.756,0.752,0.748,0.744,0.74,0.736,0.732,0.728,0.724,0.72,0.716,0.712,0.708,0.704,0.7,0.696,0.692,0.688,0.684,0.68,0.676,0.672,0.668,0.664,0.66,0.656,0.652,0.648,0.644,0.64,0.636,0.632,0.628,0.624,0.62,0.616,0.612,0.608,0.604,0.6,0.596,0.592,0.588,0.584,0.58,0.576,0.572,0.568,0.564,0.56,0.556,0.552,0.548,0.544,0.54,0.536,0.532,0.528,0.524,0.52,0.516,0.512,0.508,0.504,0.5,0.496,0.492,0.488,0.484,0.48,0.476,0.472,0.468,0.464,0.46,0.456,0.452,0.448,0.444,0.44,0.436,0.432,0.428,0.424,0.42,0.416,0.412,0.408,0.404,0.4,0.396,0.392,0.388,0.384,0.38,0.376,0.372,0.368,0.364,0.36,0.356,0.352,0.348,0.344,0.34,0.336,0.332,0.328,0.324,0.32,0.316,0.312,0.308,0.304,0.3,0.296,0.292,0.288,0.284,0.28,0.276,0.272,0.268,0.264,0.26,0.256,0.252,0.248,0.244,0.24,0.236,0.232,0.228,0.224,0.22,0.216,0.212,0.208,0.204,0.2,0.196,0.192,0.188,0.184,0.18,0.176,0.172,0.168,0.164,0.16,0.156,0.152,0.148,0.144,0.14,0.136,0.132,0.128,0.124,0.12,0.116,0.112,0.108,0.104,0.1,0.096,0.092,0.088,0.084,0.08,0.076,0.072,0.068,0.064,0.06,0.056,0.052,0.048,0.044,0.04,0.036,0.032,0.028,0.024,0.02,0.016,0.012,0.008,0.004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
var bArray2 = new Array(0.504,0.508,0.512,0.516,0.52,0.524,0.528,0.532,0.536,0.54,0.544,0.548,0.552,0.556,0.56,0.564,0.568,0.572,0.576,0.58,0.584,0.588,0.592,0.596,0.6,0.604,0.608,0.612,0.616,0.62,0.624,0.628,0.632,0.636,0.64,0.644,0.648,0.652,0.656,0.66,0.664,0.668,0.672,0.676,0.68,0.684,0.688,0.692,0.696,0.7,0.704,0.708,0.712,0.716,0.72,0.724,0.728,0.732,0.736,0.74,0.744,0.748,0.752,0.756,0.76,0.764,0.768,0.772,0.776,0.78,0.784,0.788,0.792,0.796,0.8,0.804,0.808,0.812,0.816,0.82,0.824,0.828,0.832,0.836,0.84,0.844,0.848,0.852,0.856,0.86,0.864,0.868,0.872,0.876,0.88,0.884,0.888,0.892,0.896,0.9,0.904,0.908,0.912,0.916,0.92,0.924,0.928,0.932,0.936,0.94,0.944,0.948,0.952,0.956,0.96,0.964,0.968,0.972,0.976,0.98,0.984,0.988,0.992,0.996,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.996,0.992,0.988,0.984,0.98,0.976,0.972,0.968,0.964,0.96,0.956,0.952,0.948,0.944,0.94,0.936,0.932,0.928,0.924,0.92,0.916,0.912,0.908,0.904,0.9,0.896,0.892,0.888,0.884,0.88,0.876,0.872,0.868,0.864,0.86,0.856,0.852,0.848,0.844,0.84,0.836,0.832,0.828,0.824,0.82,0.816,0.812,0.808,0.804,0.8,0.796,0.792,0.788,0.784,0.78,0.776,0.772,0.768,0.764,0.76,0.756,0.752,0.748,0.744,0.74,0.736,0.732,0.728,0.724,0.72,0.716,0.712,0.708,0.704,0.7,0.696,0.692,0.688,0.684,0.68,0.676,0.672,0.668,0.664,0.66,0.656,0.652,0.648,0.644,0.64,0.636,0.632,0.628,0.624,0.62,0.616,0.612,0.608,0.604,0.6,0.596,0.592,0.588,0.584,0.58,0.576,0.572,0.568,0.564,0.56,0.556,0.552,0.548,0.544,0.54,0.536,0.532,0.528,0.524,0.52,0.516,0.512,0.508,0.504,0.5,0.496,0.492,0.488,0.484,0.48,0.476,0.472,0.468,0.464,0.46,0.456,0.452,0.448,0.444,0.44,0.436,0.432,0.428,0.424,0.42,0.416,0.412,0.408,0.404,0.4,0.396,0.392,0.388,0.384,0.38,0.376,0.372,0.368,0.364,0.36,0.356,0.352,0.348,0.344,0.34,0.336,0.332,0.328,0.324,0.32,0.316,0.312,0.308,0.304,0.3,0.296,0.292,0.288,0.284,0.28,0.276,0.272,0.268,0.264,0.26,0.256,0.252,0.248,0.244,0.24,0.236,0.232,0.228,0.224,0.22,0.216,0.212,0.208,0.204,0.2,0.196,0.192,0.188,0.184,0.18,0.176,0.172,0.168,0.164,0.16,0.156,0.152,0.148,0.144,0.14,0.136,0.132,0.128,0.124,0.12,0.116,0.112,0.108,0.104,0.1,0.096,0.092,0.088,0.084,0.08,0.076,0.072,0.068,0.064,0.06,0.056,0.052,0.048,0.044,0.04,0.036,0.032,0.028,0.024,0.02,0.016,0.012,0.008,0.004,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);

function getColorJET(value, minValue, maxValue){
    var index = Math.round(scaleRange(value,minValue,maxValue,0,999));
    return RGB(rArray2[index], gArray2[index], bArray2[index]);
}
