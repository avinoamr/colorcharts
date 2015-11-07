(function() {
    window.color || ( window.color = {} ) 
    window.color.bar = function ( el ) {
        return new Bar( el )
    }

    function Bar( el ) {
        this._el = el;
    }

    Bar.prototype._x0 = "";
    Bar.prototype._color = "";
    Bar.prototype._palette = window.color.palettes.set3;

    Bar.prototype.data = autodraw( getset( "_data" ) );
    Bar.prototype.x0 = autodraw( getset( "_x0" ) );
    Bar.prototype.x1 = autodraw( getset( "_x1", "" ) );
    Bar.prototype.x = alias( "x0" );
    Bar.prototype.y = autodraw( getset( "_y" ) );
    Bar.prototype.color = autodraw( getset( "_color" ) );
    Bar.prototype.palette = autodraw( getset( "_palette" ) );

    // draw once
    Bar.prototype.draw = function () {
        if ( !this._drawing ) {
            this._drawing = setTimeout( this._draw.bind( this ), 0 );
        }
        return this;
    }

    // actual drawing
    Bar.prototype._draw = function () {
        clearTimeout( this._drawing );
        delete this._drawing;
        draw( this );
        return this;
    }

    function draw( that ) {
        var el = that._el;
        el.innerHTML = "<svg></svg>";
        var svg = d3.select( el )
            .select( "svg" );

        svg.style({ height: "100%", width: "100%" });

        var height = svg.node().offsetHeight;
        var width = svg.node().offsetWidth;
        var _x0 = that._x0, _x1 = that._x1, _c = that._color, _y = that._y;

        // build the groups tree
        data = d3.nest()
            .key( function ( d ) { return d[ _x0 ] || "" } )
            .key( function ( d ) { return d[ _x1 ] || "" } )
            .key( function ( d ) { return d[ _c ]  || "" } )
            .rollup( function ( data ) {
                return data.reduce( function ( v, d ) {
                    return { y: v.y + d[ _y ], y0: 0 };
                }, { y: 0 } )
            })
            .entries( that._data );
        
        // build the scales
        console.log( data )
        var allx0 = [], allx1 = [], ally = [], allc = [];
        data.forEach( function ( d ) {
            allx0.push( d.key );
            d.values.forEach( function ( d1 ) {
                allx1.push( d1.key );
                d1.values.forEach( function ( d2 ) {
                    ally.push( d2.values.y + d2.values.y0 );
                    allc.push( d2.key )
                })
            })
        })

        var x0 = d3.scale.ordinal()
            .domain( allx0 )
            .rangeRoundBands([ 0, width ], .1 );

        var x1 = d3.scale.ordinal()
            .domain( allx1 )
            .rangeRoundBands( [ 0, x0.rangeBand() ], .01 )

        var y = d3.scale.linear()
            .domain([ 0, d3.max( ally ) ])
            .rangeRound([ 0, height ] );

        var clin = d3.scale.linear()
            .domain( [ d3.min( allc ), d3.max( allc ) ] )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        // start drawing
        var groups = svg.selectAll( "g" )
            .data( data )
            .enter().append( "g" )
            .attr( "data-group", function ( d ) {
                return d.key;
            })

        groups.attr( "transform", function ( d ) {
            return "translate(" + x0( d.key ) + ",0)";
        })

        var bars = groups.selectAll( "g" )
            .data(function ( d ) { return d.values })
            .enter().append( "g" )
            .attr( "data-bar", function ( d ) {
                return d.key;
            });

        bars.attr( "transform", function ( d ) {
            return "translate(" + x1( d.key ) + ",0)";
        })

        var rects = bars.selectAll( "rect" )
            .data( function ( d ) { return d.values } )
            .enter().append( "rect" )

        rects
            .attr( "y", function ( d ) {
                return height - y( d.values.y ) - y( d.values.y0 )
            })
            .attr( "height", function ( d ) {
                return y( d.values.y );
            })
            .attr( "width", function ( d ) {
                return x1.rangeBand()
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
    }

    function extend( target, obj ) {
        Object.keys( obj || {} ).forEach( function ( key ) {
            target[ key ] = obj[ key ];
        });
        return target;
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

    function alias ( name ) {
        return function () {
            return this[ name ].apply( this, arguments );
        }
    }


})()