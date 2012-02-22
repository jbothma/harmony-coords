const REV = 6,
       BRUSHES = ["simple"],
       USER_AGENT = navigator.userAgent.toLowerCase();

var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    BRUSH_SIZE = 1,
    BRUSH_PRESSURE = 1,
    simulatePressure = true,
    drawingAllowed = true,
    COLOR = [0, 0, 0],
    BACKGROUND_COLOR = [250, 250, 250],
    STORAGE = window.localStorage,
    brush,
    saveTimeOut,
    i,
    mouseX = 0,
    mouseY = 0,
    container,
    menu,
    canvas,
    flattenCanvas,
    context,
    isFgColorSelectorVisible = false,
    isBgColorSelectorVisible = false,
    isMenuMouseOver = false,
    shiftKeyIsDown = false,
    altKeyIsDown = false,
    strokes = [];

init();

function init()
{
	var hash, embed;
	
	if (USER_AGENT.search("android") > -1 || USER_AGENT.search("iphone") > -1)
		BRUSH_SIZE = 2;
	
	document.body.style.backgroundRepeat = 'no-repeat';
	document.body.style.backgroundPosition = 'center center';	
	
	container = document.createElement('div');
	document.body.appendChild(container);

	canvas = document.createElement("canvas");
	canvas.width = SCREEN_WIDTH;
	canvas.height = SCREEN_HEIGHT;
	canvas.style.cursor = 'crosshair';
	container.appendChild(canvas);
	
	context = canvas.getContext("2d");
	
	flattenCanvas = document.createElement("canvas");
	flattenCanvas.width = SCREEN_WIDTH;
	flattenCanvas.height = SCREEN_HEIGHT;

	menu = new Menu();
	menu.clear.addEventListener('click', onMenuClear, false);
	menu.clear.addEventListener('touchend', onMenuClear, false);
	menu.allow.addEventListener('click', onMenuAllow, false);
	menu.allow.addEventListener('touchend', onMenuAllow, false);
	menu.container.addEventListener('mouseover', onMenuMouseOver, false);
	menu.container.addEventListener('mouseout', onMenuMouseOut, false);
	container.appendChild(menu.container);
	
	if (window.location.hash)
	{
		hash = window.location.hash.substr(1,window.location.hash.length);

		for (i = 0; i < BRUSHES.length; i++)
		{
			if (hash == BRUSHES[i])
			{
				brush = eval("new " + BRUSHES[i] + "(context)");
				break;
			}
		}
	}

	if (!brush)
	{
		brush = eval("new " + BRUSHES[0] + "(context)");
	}


	if (STORAGE)
	{		
		if (localStorage.getItem("strokes"))
		{
			strokes = JSON.parse(localStorage.getItem("strokes"));
			redraw(strokes);
		}
	} else {
		alert("Your browser doesn't support storage. Your drawing will be lost when you leave or reload this page.");
	}
	
	window.addEventListener('mousemove', onWindowMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('blur', onWindowBlur, false);
	
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	document.addEventListener('mouseout', onDocumentMouseOut, false);
	
	document.addEventListener("dragenter", onDocumentDragEnter, false);  
	document.addEventListener("dragover", onDocumentDragOver, false);
	document.addEventListener("drop", onDocumentDrop, false);  
	
	canvas.addEventListener('mousedown', onCanvasMouseDown, false);
	canvas.addEventListener('touchstart', onCanvasTouchStart, false);
	
	onWindowResize(null);
}


// WINDOW

function onWindowMouseMove( event )
{
	mouseX = event.clientX;
	mouseY = event.clientY;
}

function onWindowResize()
{
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	
	menu.container.style.left = ((SCREEN_WIDTH - menu.container.offsetWidth) / 2) + 'px';
}

function onWindowKeyDown( event )
{
	switch(event.keyCode)
	{
		case 68: // d
			if(BRUSH_SIZE > 1) BRUSH_SIZE --;
			break;
		
		case 70: // f
			BRUSH_SIZE ++;
			break;			
	}
}

function onWindowBlur( event )
{
	shiftKeyIsDown = false;
	altKeyIsDown = false;
}


// DOCUMENT

function onDocumentMouseDown( event )
{
	if (!isMenuMouseOver)
		event.preventDefault();
}

function onDocumentMouseOut( event )
{
	onCanvasMouseUp();
}

function onDocumentDragEnter( event )
{
	event.stopPropagation();
	event.preventDefault();
}

function onDocumentDragOver( event )
{
	event.stopPropagation();
	event.preventDefault();
}

function onDocumentDrop( event )
{
	event.stopPropagation();  
	event.preventDefault();
	
	var file = event.dataTransfer.files[0];
	
	if (file.type.match(/image.*/))
	{
		/*
		 * TODO: This seems to work on Chromium. But not on Firefox.
		 * Better wait for proper FileAPI?
		 */

		var fileString = event.dataTransfer.getData('text').split("\n");
		document.body.style.backgroundImage = 'url(' + fileString[0] + ')';
	}	
}

function onMenuSelectorChange()
{
	if (BRUSHES[menu.selector.selectedIndex] == "")
		return;

	brush.destroy();
	brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");

	window.location.hash = BRUSHES[menu.selector.selectedIndex];
}

function onMenuMouseOver()
{
	isMenuMouseOver = true;
}

function onMenuMouseOut()
{
	isMenuMouseOver = false;
}

function onMenuCoords()
{
	var strokesString = "";
	for (stroke in strokes)
	{
		strokesString += JSON.stringify(strokes[stroke]) + "\n";
	}
	alert(strokesString);
}

function onMenuClear()
{
	if (!confirm("Are you sure?"))
		return;
		
	context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	strokes = [];

	saveToLocalStorage();

	brush.destroy();
	brush = eval("new " + BRUSHES[0] + "(context)");
}

function onMenuAllow()
{
	drawingAllowed = menu.allow.checked;
}

// CANVAS

function onCanvasMouseDown( event )
{
	var data, position;

	clearTimeout(saveTimeOut);
	cleanPopUps();

	if (drawingAllowed)
	{
		BRUSH_PRESSURE = 1
		
		saveStrokeStart( event.clientX, event.clientY, BRUSH_PRESSURE );
		brush.strokeStart( event.clientX, event.clientY );
	
		window.addEventListener('mousemove', onCanvasMouseMove, false);
		window.addEventListener('mouseup', onCanvasMouseUp, false);
	}
}

function onCanvasMouseMove( event )
{
	var x = event.clientX,
		y = event.clientY;
	
	if (drawingAllowed)
	{
		BRUSH_PRESSURE = (menu.pressure.checked) ? movePressure( x, y ) : 1;
		saveStrokeMove( x, y, BRUSH_PRESSURE );
		brush.stroke( x, y );
	}
}

function onCanvasMouseUp()
{
	if (drawingAllowed)
	{
		brush.strokeEnd();
		
		window.removeEventListener('mousemove', onCanvasMouseMove, false);
		window.removeEventListener('mouseup', onCanvasMouseUp, false);
		
		if (STORAGE)
		{
			clearTimeout(saveTimeOut);
			saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
		}
	}
}

function onCanvasTouchStart( event )
{
	cleanPopUps();		

	if(event.touches.length == 1 && drawingAllowed)
	{
		event.preventDefault();
		
		clearTimeout(saveTimeOut);
		BRUSH_PRESSURE = 1;

		saveStrokeStart( event.touches[0].pageX, event.touches[0].pageY, BRUSH_PRESSURE );
		brush.strokeStart( event.touches[0].pageX, event.touches[0].pageY );
		
		window.addEventListener('touchmove', onCanvasTouchMove, false);
		window.addEventListener('touchend', onCanvasTouchEnd, false);
	}
}

function onCanvasTouchMove( event )
{
	if(event.touches.length == 1 && drawingAllowed)
	{
		var x = event.touches[0].pageX,
			y = event.touches[0].pageY;

		BRUSH_PRESSURE = (menu.pressure.checked) ? (2 * movePressure( x, y )) : 1;
		saveStrokeMove( x, y, BRUSH_PRESSURE );
		brush.stroke( x, y );
	}
}

function onCanvasTouchEnd( event )
{
	if(event.touches.length == 0 && drawingAllowed)
	{
		event.preventDefault();
		
		brush.strokeEnd();

		window.removeEventListener('touchmove', onCanvasTouchMove, false);
		window.removeEventListener('touchend', onCanvasTouchEnd, false);
		
		if (STORAGE)
		{
			clearTimeout(saveTimeOut);
			saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
		}
	}
}

function saveStrokeStart(X, Y, Z)
{
	strokes.push([{'X': X,
				   'Y': Y,
				   'Z': Z }]);
}

function saveStrokeMove(X, Y, Z)
{
	strokes[strokes.length-1].push({'X': X,
									'Y': Y,
									'Z': Z });
}

function saveToLocalStorage()
{
	localStorage.setItem("strokes", JSON.stringify(strokes));
}

function redraw(strokes)
{
	for (stroke in strokes)
	{
		moves = strokes[stroke];
		
		brush.strokeStart(moves[0].X, moves[0].Y);
		
		for(move in moves)
		{
			BRUSH_PRESSURE = moves[move].Z;
			brush.stroke(moves[move].X, moves[move].Y);
		}
		
		brush.strokeEnd();
	}
}

/**
 * This simulates pressure for current move event based on last
 * mouse position in last stroke.
 *
 * It looks directly at the global strokes variable so it should be
 * called upon 'mouse move' or 'touch move' events but before adding
 * the new stroke to the strokes data.
 */
function movePressure(x, y)
{
	var lastStroke = strokes[strokes.length-1],
		lastMove = lastStroke[lastStroke.length-1],
		lastX = lastMove.X,
		lastY = lastMove.Y,
		dist = Math.sqrt(Math.pow((x-lastX),2) + Math.pow((y-lastY),2)), // thanks pythagoras
		pressure;

	// long distance between this and last move should give low pressure.
	// log scale gives more precision in high pressure range.
	// Add 1 to avoid division by zero
	// 2/ instead of 1/ because brushes halve the pressure value given.
	pressure = 2/(1 + Math.log(dist));

	return pressure;
}

function flatten()
{
	var context = flattenCanvas.getContext("2d");
	
	context.fillStyle = 'rgb(' + BACKGROUND_COLOR[0] + ', ' + BACKGROUND_COLOR[1] + ', ' + BACKGROUND_COLOR[2] + ')';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(canvas, 0, 0);
}

function cleanPopUps()
{
	if (isFgColorSelectorVisible)
	{
		foregroundColorSelector.hide();
		isFgColorSelectorVisible = false;
	}
		
	if (isBgColorSelectorVisible)
	{
		backgroundColorSelector.hide();
		isBgColorSelectorVisible = false;
	}
}
