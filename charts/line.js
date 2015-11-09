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

    Line.prototype._palette = window.color.palettes.default;;

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

        var _x = that._x, _c = that._color, _y = that._y;

        // stack by colors
        var points = that._data
        var extent = d3.extent( points, function ( d ) { return d[ _x ] } );
        var data = d3.nest()
            .key( function ( d ) { return d[ _c ]  || "" } )
            .rollup( function ( data ) {

                // if this line begins after the chart's start, add a zero-
                // height segment to precede it
                var minx = d3.min( data, function ( d ) { return d[ _x ] } );
                if ( minx != extent[ 0 ] ) {
                    var min1 = {}; min1[ _y ] = 0; min1[ _x ] = minx;
                    var min2 = {}; min2[ _y ] = 0; min2[ _x ] = extent[ 0 ];
                    data.unshift( min1, min2 );
                }

                // if this line begins before the chart's end, add a zero-
                // height segment to succeed it
                var maxx = d3.max( data, function ( d ) { return d[ _x ] } );
                if ( maxx != extent[ 1 ] ) {
                    var max1 = {}; max1[ _y ] = 0; max1[ _x ] = maxx;
                    var max2 = {}; max2[ _y ] = 0; max2[ _x ] = extent[ 1 ];
                    data.push( max1, max2 )
                }

                // sort it by the x-coordinate to make sure the path the drawing
                // is sane
                data.sort( function ( d1, d2 ) {
                    return d1[ _x ] - d2[ _x ];
                })

                return data;
            })
            .entries( that._data );

        var x = d3.scale.linear()
            .domain( d3.extent( points, function ( d ) { return d[ _x ] } ) )
            .range( [ 0, svg.node().offsetWidth ] )

        var y = d3.scale.linear()
            .domain( [ 0, d3.max( points, function ( d ) { return d[ _y ] } ) ] )
            .range( [ 0, svg.node().offsetHeight ] );

        var allc = data.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        var area = d3.svg.area()
            .x( function ( d ) { return x( d[ _x ] ) } )
            .y0( y.range()[ 1 ] )
            .y1( function ( d ) { return y.range()[ 1 ] - y( d[ _y ] ) } )

        var line = d3.svg.line()
            // .interpolate( "basis" )
            .x( function ( d ) { return x( d[ _x ] ) } )
            .y( function ( d ) { return y.range()[ 1 ] - y( d[ _y ] ) } )

        var lines = svg.selectAll( "path[data-line]" )
            .data( data )

        lines.exit().remove();
        lines.enter().append( "path" )
            .attr( "data-line", function ( d ) {
                return d.key;
            })
            .attr( "fill", "none" )
        
        lines
            .attr( "d", function ( d ) { 
                return line( d.values ) 
            }).attr( "stroke", function ( d ) {
                return c( d.key );
            })
        

        var areas = svg.selectAll( "path[data-area]" )
            .data( data );

        areas.exit().remove()
        areas.enter().append( "path" )
            .attr( "data-area", function ( d ) {
                return d.key;
            })
            .attr( "stroke", "none" )
            .style( "opacity", .1 )

        areas
            .attr( "d", function ( d ) { 
                return area( d.values ) 
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            });
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