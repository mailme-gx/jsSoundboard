// Board class
Board = function(keys) {
	this.chars = [['1','2','3','4','5','6','7','8','9','0'],['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l',';'],['z','x','c','v','b','n','m',',','.','/']];
	this.selectedSet = 0;
	this.el = document.createElement('table');
	this.el.style.width = '99.5%';	
	$(this.el).hide();
	document.getElementById("board").appendChild(this.el);
	this.initKeys();
	$("#btnRenameSet").click(bind(this, this.renameSet));
	$("#btnDuplicateSet").click(bind(this, this.cloneSet));
	$("#btnDeleteSet").click(bind(this, this.deleteSet));
	this.loadSet(getCookie("lastset"));

};

Board.prototype.initKeys = function() {
	this.keys = [];
	$(this.el).empty();
	for(var i = 0; i < 4; i++) {
		this.keys[i] = [];
		var rowEl = document.createElement('tr');
		this.el.appendChild(rowEl);
		for(var j = 0; j < 10; j++) {
			var chr = this.getChrStr(i,j);
			this.keys[i][j] = new Key(chr);
			rowEl.appendChild(this.keys[i][j].el);
		}
	}
};

Board.prototype.setKey = function(chr, wav, dscr, col) {
	var pos = this.getChrPos(chr);
	if(pos)
		this.keys[pos[0]][pos[1]].setValues(wav, dscr, col);
};

Board.prototype.getKey = function(chr, wav, dscr) {
	var pos = this.getChrPos(chr);
	if(pos)
		return this.keys[pos[0]][pos[1]];
};

Board.prototype.getChrPos = function(chr) {
	for(var i = 0; i < 4; i++) 
		for(var j = 0; j < 10; j++) 
			if(this.chars[i][j] == chr) 
				return [i,j];
};

Board.prototype.getChrStr = function(row,col) {
	return this.chars[row][col];
};

Board.prototype.keypress = function(e) {
	var k = this.getKey(String.fromCharCode(e.charCode).toLowerCase());
	if(k != null) 
		return k.play();			
	if(String.fromCharCode(e.charCode) == ' ')
		for(var i = 0; i < 4; i++) 
			for(var j = 0; j < 10; j++) 
				this.keys[i][j].stop();
};

Board.prototype.loadData = function() {
	$.ajax({ url: App.data_path }).done(bind(this, function(data) {
		this.sets = $.parseJSON(data);
		App.setSelector.load(this.sets);
		this.loadSet(this.selectedSet);
		if(this.selectedSet) {
			$("#set").val(this.selectedSet);
		}
	}));
};

Board.prototype.loadSet = function(set) {
	$(this.el).hide();	
	$("#setOptions").hide();	
	this.initKeys();
	this.selectedSet = set;
	// remember last set
	setCookie("lastset", this.selectedSet);
	if(this.sets != null && this.sets[set] != null) {
		var data = this.sets[set];
		for(var i = 0; i < data.length; i++) 
			this.setKey(data[i].chr, data[i].wav, data[i].txt, data[i].col);
		$(this.el).show();	
		$("#setOptions").show();	
	}
};

Board.prototype.addSet = function(set) {
	this.sets = this.sets || {};
	if(set != null && set != "") {
		if(this.sets[set] == null) {
			this.sets[set] = [];
			this.selectedSet = set;
			this.persistChanges();
			this.loadData();
		} else
			alert("Set with that name already exists!");
	} 
};

Board.prototype.renameSet = function() {
	var s = prompt("Let it be known that the set '" + this.selectedSet + "' shall from this day be known as:", this.selectedSet);
	if (this.sets != null && this.sets[this.selectedSet] != null && s != null && s != "") {
		if(this.sets[s] == null) {
			this.sets[s] = this.sets[this.selectedSet];
			delete this.sets[this.selectedSet];
			this.selectedSet = s;
			this.persistChanges();
			this.loadData();
		} else
			alert("Set with that name already exists!");

	}
};

Board.prototype.cloneSet = function() {
	var s = prompt("I take thee set '" + this.selectedSet + "' and with thee create a new set to be identified by:");
	if (this.sets != null && this.sets[this.selectedSet] != null && s != null && s != "") {
		if(this.sets[s] == null) {
			this.sets[s] = this.sets[this.selectedSet];
			this.selectedSet = s;
			this.persistChanges();
			this.loadData();
		} else
			alert("Set with that name already exists!");

	}
};

Board.prototype.deleteSet = function() {
	if(confirm("Are you sure you want to delete " + this.selectedSet)) {
			delete this.sets[this.selectedSet];
			this.selectedSet = null;
			this.persistChanges();
			this.loadData();
	}

};

Board.prototype.persistChanges = function() {
	if(this.sets == null)
		return;
	if(this.selectedSet != null) {
		var map = [];
		for(var i = 0; i < 4; i++) {
			for(var j = 0; j < 10; j++) 
				if(this.keys[i][j].wav != null || this.keys[i][j].dscr != null)
					map.push(this.keys[i][j].toJson());
		}
		this.sets[this.selectedSet] = map;
	}

	$.ajax({ type: "POST", url: App.data_path, data: { data: JSON.stringify(this.sets)} });
};

// Key class
Key = function(chr, elType, readonly) {
	this.chr = chr;
	this.el = document.createElement(elType || 'td');
	this.el.className = "key disabled outer";
	this.el.addEventListener("click",  bind(this, this.play));
	this.dscrEl = document.createElement('span');
	this.dscrEl.className = 'inner-large';
	this.dscrEl.innerHTML = '&nbsp;';
	this.btnEl = document.createElement('span');
	this.btnEl.className = 'key inner-small';
	this.btnEl.innerHTML = this.chr.toUpperCase();
	if(!readonly)
		this.btnEl.addEventListener("click",  bind(this, function(e){
			App.editor.init(this);
			e.stopPropagation();
		}));
	this.el.appendChild(this.btnEl);
	this.el.appendChild(this.dscrEl);
};

Key.prototype.play = function() {
	if(this.audio == null) return;
	var a = null;
	for(var i = 0; i < this.audio.length; i++) 
		if(this.audio.paused) {
			a = this.audio.paused;
			break
		}
	if(a == null) {
		a = this.audio[0].cloneNode(true);
		this.audio.push(a);
		a.play();
	}
};

Key.prototype.stop = function() {
	if(this.audio == null) return;
	for(var i = 0; i < this.audio.length; i++)  {
		this.audio[i].pause();
		this.audio[i].currentTime = 0;
	}
};

Key.prototype.toJson = function() {
	return {chr: this.chr, wav: this.wav, txt: this.dscr, col: this.col};
};

Key.prototype.setValues = function(wav, dscr, col) {
	this.wav = wav || '';
	this.dscr = dscr || wav;
	this.col = col;
	if(this.wav != '') {
		this.audio = [];
		this.audio[0] = new Audio();
		this.audio[0].setAttribute("src", App.samples_path + this.wav);
		this.audio[0].addEventListener("play",  bind(this, this.onplay));
		this.audio[0].addEventListener("ended",  bind(this, this.onplayend));
	}
	this.el.className = "key outer";
	this.dscrEl.innerHTML = this.dscr;
	this.el.style.background = this.col;

};

Key.prototype.onplay = function(e) {
	this.el.className = "key pressed outer";
	this.btnEl.className = 'key pressed inner-small';
};
Key.prototype.onplayend = function(e) {
	this.el.className = "key outer";
	this.btnEl.className = 'key inner-small';
};

// Editor class
Editor = function() {
	this.key = {};
	this.el = $("#edit");
	this.keyEl = $("#key");
	this.wavEl = $("#wav");
	this.txtEl = $("#txt");
	this.colEl = $("#col");
	$("#btnSave").click(bind(this, this.setValues));
	$("#btnCancel").click(bind(this, this.close));
	$("#btnReload").click(bind(this, this.loadSounds));
	$("#btnFileman").click(bind(this, function(){window.open("/fm"); }));

	this.txtEl.keypress(function(e) {e.stopPropagation();});
	this.wavEl.keypress(function(e) {e.stopPropagation();});
	this.loadSounds();

	this.colorKey = new Key("?", 'div', true);
	$("#keyColor").append(this.colorKey.el);
	this.colorPicker = new jscolor.color(this.colEl[0], {
		hash: true,
		onImmediateChange: bind(this, function() {
			this.colorKey.setValues(null, this.colEl.val(), this.colEl.val());
		})
	});
	$(this.colorKey.el).css("width", "80px");
	$("#col").css("width", "80px");
	this.colorKey.el.addEventListener("click", bind(this, function() {
		this.colorPicker.showPicker();
	}));
};

Editor.prototype.init = function(key) {
	this.key = key || {};
	$(this.el).show();
	this.keyEl.val(this.key.chr || '');
	this.wavEl.val(this.key.wav || '');
	this.txtEl.val(this.key.dscr || '');
	this.colEl.val(this.key.col || '');
	this.colorPicker.fromString(this.colEl.val() == '' ? '#f9f9f9' : this.colEl.val());
	this.colorKey.setValues(null, this.colEl.val(), this.colEl.val());
};

Editor.prototype.setValues = function() {
	this.key.setValues(this.wavEl.val(), this.txtEl.val(), this.colEl.val());
	this.close();
	App.board.persistChanges();
};


Editor.prototype.close = function() {
	this.init();
	$(this.el).hide();
};

Editor.prototype.loadSounds = function() {
	$.ajax({ url: App.samples_path }).done(function(data) {
		$("#wav").autocomplete({source: $.parseJSON(data), select: function( event, ui ) {
		if($("#txt").val() == "")
			$("#txt").val($("#wav").val());
		}});
	});
};

// SetSelector class
SetSelector = function(elId) {
	this.el = $("#set");
	this.el.change(function() {
		App.board.loadSet($("#set option:selected").val());
	});
	$("#btnNewSet").click(bind(this, function(){
		var s = prompt("I hereby baptize thee new pristine selection of sounds as:");
		if (s != null && s != "") 
			App.board.addSet(s);
	}));
}

SetSelector.prototype.load = function(sets) {
	var a = [];
	for(var key in sets)
		a.push(key);
	a.sort();

	this.el.empty();
	this.el.append('<option value="">Load a Set</option>');
	for(var i in a)
		this.el.append('<option value="' + a[i] + '">' + a[i] + '</option>');
};

// generic functions

function bind(scope, fn) {
    return function () {
        fn.apply(scope, arguments);
    };
};

function getCookie(c_name) {
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if(c_start == -1)
		c_start = c_value.indexOf(c_name + "=");
	if (c_start == -1)
		c_value = null;
	else {
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1)
			c_end = c_value.length;
		c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
};

function setCookie(c_name, c_value) {
	document.cookie=c_name + "=" + escape(c_value);
};

