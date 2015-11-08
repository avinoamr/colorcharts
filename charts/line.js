(function () {
    var color = window.color;
    color.line = function ( el ) {
        var line = d3.select( el ).data()[ 0 ];

        if ( !( line instanceof Line ) ) {
            var line = new Line( el );
            d3.select( el ).data( [ line ] );
        }
        
        return line;
    }

    function Line( el ) {
        this._el = el;
        el.innerHTML = "<svg></svg>";
    }

    Line.prototype.data = autodraw( getset( "_data" ) );
    Line.prototype.x = autodraw( getset( "_x" ) );
    Line.prototype.y = autodraw( getset( "_y" ) );
    Line.prototype.color = autodraw( getset( "_color" ) );
    Line.prototype.palette = autodraw( getset( "_palette" ) );

    // draw once
    Line.prototype.draw = function () {
        if ( !this._drawing ) {
            this._drawing = setTimeout( this._draw.bind( this ), 0 );
        }
        return this;
    }

    // actual drawing
    Line.prototype._draw = function () {
        clearTimeout( this._drawing );
        delete this._drawing;
        draw( this );
        return this;
    }


    function draw( that ) {
        var svg = d3.select( that._el )
            .select( "svg" )
            .style( "height", "100%" )
            .style( "width", "100%" );;

        
    }


    function getset ( key ) {
        return function ( value ) {
            if ( arguments.length == 0 ) {
                return this[ key ];
            }

            this[ key ] = value;
            return this;
        }
    }

    function autodraw ( fn ) {
        return function () {
            var rv = fn.apply( this, arguments );
            return rv == this ? this.draw() : rv;
        }
    }

})()