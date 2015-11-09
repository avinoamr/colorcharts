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
    Line.prototype._stack = false;

    Line.prototype.data = autodraw( getset( "_data" ) );
    Line.prototype.x = autodraw( getset( "_x" ) );
    Line.prototype.y = autodraw( getset( "_y" ) );
    Line.prototype.stack = autodraw( getset( "_stack" ) );
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

        // extract the values for each obj
        var data = that._data.map( function ( d ) {
            return { x: d[ _x ], y: d[ _y ], c: d[ _c ], obj: d }
        })

        // stack by colors
        var xExtent = d3.extent( data, function ( d ) { return d.x });
        var yExtent = d3.extent( data, function ( d ) { return d.y });
        data = d3.nest()
            .key( function ( d ) { return d.c  || "" } )
            .rollup( function ( data ) {
                // if this line begins after the chart's start, add a zero-
                // height segment to precede it
                var minx = d3.min( data, function ( d ) { return d.x } );
                if ( minx != xExtent[ 0 ] ) {
                    data.unshift( { x: minx, y: 0 }, { x: xExtent[ 0 ], y :0 });
                }

                // if this line begins before the chart's end, add a zero-
                // height segment to succeed it
                var maxx = d3.max( data, function ( d ) { return d.x } );
                if ( maxx != xExtent[ 1 ] ) {
                    data.push( { x: maxx, y: 0 }, { x: xExtent[ 1 ], y: 0 } )
                }

                // sort it by the x-coordinate to make sure the path the drawing
                // is sane
                data.sort( function ( d1, d2 ) {
                    return d1.x - d2.x;
                })

                return data;
            })
            .entries( data );

        // build the scales
        var x = d3.time.scale()
            .domain( xExtent )
            .range( [ 0, svg.node().offsetWidth ] )

        var y = d3.scale.linear()
            .domain( [ 0, yExtent[ 1 ] ] )
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
            .x( function ( d ) { return x( d.x ) } )
            .y0( y.range()[ 1 ] )
            .y1( function ( d ) { return y.range()[ 1 ] - y( d.y ) } )

        var line = d3.svg.line()
            .x( function ( d ) { return x( d.x ) } )
            .y( function ( d ) { return y.range()[ 1 ] - y( d.y ) } )

        // start drawing
        var axis = svg.selectAll( "g[data-axis='x']" )
            .data( [ data ] )

        axis.enter().append( "g" )
            .attr( "data-axis", "x" )
            .attr( "transform", "translate(0," + ( y.range()[ 1 ] - 30 ) + ")" );

        axis.call( xlabels( x ) )

        var groups = svg.selectAll( "g[data-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-group", function ( d ) {
                return d.key;
            })

        var lines = groups.selectAll( "path[data-line]" )
            .data( function ( d ) { return [ d ] } )
        lines.exit().remove();
        lines.enter().append( "path" )
            .attr( "data-line", "" )
            .attr( "fill", "none" )
        lines
            .attr( "d", function ( d ) { 
                console.log( d.values )
                return line( d.values ) 
            })
            .attr( "stroke", function ( d ) {
                return c( d.key );
            });

        var areas = groups.selectAll( "path[data-area]" )
            .data( function ( d ) { return [ d ] } );
        areas.exit().remove()
        areas.enter().append( "path" )
            .attr( "data-area", "" )
            .attr( "stroke", "none" )
        areas
            .attr( "d", function ( d ) { 
                return area( d.values ) 
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
            .style( "opacity", that._stack ? 1 : .1 );
    }

    function xlabels ( x ) {
        var xAxis = d3.svg.axis()
            .scale( x )
            .orient( "bottom" )
            .tickSize( 10, 0 )
            .ticks( 2 );

        return function () {
            this.call( xAxis )
                .each( function () {
                    d3.select( this )
                        .selectAll( "path.domain" )
                        .attr( "fill", "white" );
                })
                .selectAll( "g.tick" )
                    .each( function () {
                        var tick = d3.select( this );
                        tick.select( "line" ).attr( "stroke", "white" )
                        var text = tick.select( "text" )
                            .attr( "fill", "white" )
                    })
        }
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