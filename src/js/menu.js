function Menu()
{	
	this.init();
}

Menu.prototype = 
{
	container: null,
	
	foregroundColor: null,
	backgroundColor: null,
	
	selector: null,
	coords: null,
	pressure: null,
	clear: null,
	
	init: function()
	{
		var option, space, separator, color_width = 15, color_height = 15;

		this.container = document.createElement("div");
		this.container.className = 'gui';
		this.container.style.position = 'absolute';
		this.container.style.top = '0px';
		
		space = document.createTextNode(" ");
		this.container.appendChild(space);

		space = document.createTextNode(" ");
		this.container.appendChild(space);
		
		space = document.createTextNode(" ");
		this.container.appendChild(space);
		
		// CLEAR CANVAS and stored coordinates 
		this.clear = document.createElement("Clear");
		this.clear.className = 'button';
		this.clear.innerHTML = 'Clear';
		this.container.appendChild(this.clear);

		separator = document.createTextNode("|");
		this.container.appendChild(separator);

		// SIMULATE PRESSURE?
		this.pressLabel = document.createElement("span");
		this.pressLabel.innerHTML = 'Pressure';
		this.container.appendChild(this.pressLabel);

		this.pressure = document.createElement("input");
		this.pressure.type = 'checkbox';
		this.pressure.checked = true;
		this.container.appendChild(this.pressure);

		this.container.appendChild(document.createTextNode("|"));

		// ALLOW DRAWING?
		this.allowLabel = document.createElement("span");
		this.allowLabel.innerHTML = 'Allow&nbsp;Drawing';
		this.allowLabel.title = 'For demo: Sets a javascript variable which'
		 + ' is checked when you try to draw';
		this.container.appendChild(this.allowLabel);

		this.allow = document.createElement("input");
		this.allow.type = 'checkbox';
		this.allow.checked = true;
		this.container.appendChild(this.allow);
	}
}
