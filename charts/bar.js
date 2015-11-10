(function() {
    var color = window.color;
    color.bar = function ( el ) {
        var bar = d3.select( el ).data()[ 0 ];

        if ( !( bar instanceof Bar ) ) {
            var bar = new Bar( el );
            d3.select( el ).data( [ bar ] );
        }
        
        return bar;
    }

    function Bar( el ) {
        this._el = el;
        el.innerHTML = "<svg></svg>";
    }

    Bar.prototype._x1 = "";
    Bar.prototype._color = "";
    Bar.prototype._palette = window.color.palettes.default;

    Bar.prototype.data = getset( "_data" );
    Bar.prototype.x0 = getset( "_x0" );
    Bar.prototype.x1 = getset( "_x1" );
    Bar.prototype.x = alias( "x0" );
    Bar.prototype.y = getset( "_y" );
    Bar.prototype.color = getset( "_color" );
    Bar.prototype.palette = getset( "_palette" );

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
        var svg = d3.select( that._el )
            .select( "svg" )
            .style( "height", "100%" )
            .style( "width", "100%" );

        // extract the values for each obj
        var data = that._data.map( function ( d ) {
            var x0 = d[ that._x0 ];
            var x1 = d[ that._x1 ];
            var y = d[ that._y ];
            var c = d[ that._color ];

            if ( isNaN( +y ) ) {
                throw new Error( "y-dimension must be a number" );
            }

            return { x0: x0, x1: x1, y: y, y0: 0, c: c, obj: d }
        })

        // build the groups tree
        data = d3.nest()
            .key( function ( d ) { return d.x0 || "" } )
            .key( function ( d ) { return d.x1 || "" } )
            .key( function ( d ) { return d.c  || "" } )
            .rollup( function ( data ) {
                return data.reduce( function ( v, d ) {
                    return { y: v.y + d.y, y0: 0 };
                }, { y: 0 } )
            })
            .entries( data );

        // extract the colors and bars from the data tree
        var bars = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 2 } )
            .values( function ( d ) { return d.values || d } )
            .entries( data );

        var colors = color.tree.dfs()
            .filter( function ( d, i, j ) { return j == 3 } )
            .values( function ( d ) { return d.values || d } )
            .entries( data );

        // stack the colors
        bars.map( function ( data ) {
            return data.values.map( function ( d ) { 
                return [ d.values ] 
            })
        })
        .forEach( d3.layout.stack() );
        
        // build the scales
        var allx0 = data.map( function ( d ) { return d.key });
        var x0 = d3.scale.ordinal()
            .domain( allx0 )
            .rangeRoundBands([ 0, svg.node().offsetWidth ], .1 );

        var allx1 = bars.map( function ( d ) { return d.key })
        var x1 = d3.scale.ordinal()
            .domain( allx1 )
            .rangeRoundBands( [ 0, x0.rangeBand() ], .01 )

        var ally = colors.map( function ( d ) { return d.values.y + d.values.y0 } );
        var y = d3.scale.linear()
            .domain([ 0, d3.max( ally ) ])
            .rangeRound([ 0, svg.node().offsetHeight ] );

        var allc = colors.map( function ( d ) { return d.key } );
        var clin = d3.scale.linear()
            .domain( d3.extent( allc ) )
            .range( [ that._palette.from, that._palette.to ] );

        var cord = d3.scale.ordinal()
            .domain( allc )
            .range( that._palette )

        var c = that._palette.from && that._palette.to ? clin : cord;

        // start drawing
        var groups = svg.selectAll( "g[data-group]" )
            .data( data );
        groups.exit().remove();
        groups.enter().append( "g" )
            .attr( "data-group", function ( d ) {
                return d.key;
            })
            .attr( "transform", function ( d ) {
                return "translate(" + x0( d.key ) + ",0)";
            })

        groups
            .call( xlabels( x0, y ) )
            .transition()
            .attr( "transform", function ( d ) {
                var x = x0( d.key );
                var y = 0;
                return "translate(" + x + "," + y + ")";
            })

        var bars = groups.selectAll( "g[data-bar]" )
            .data( function ( d ) { return d.values } );
        bars.exit().remove();
        bars.enter().append( "g" )
            .attr( "data-bar", function ( d ) {
                return d.key;
            });

        bars
            .call( xlabels( x1, y ) )
            .transition()
            .attr( "transform", function ( d ) {
                return "translate(" + x1( d.key ) + ",0)";
            })

        var rects = bars.selectAll( "rect[data-color]" )
            .data( function ( d ) { return d.values } );
        rects.exit().remove();
        rects.enter().append( "rect" )
            .attr( "data-color", function ( d ) {
                return d.key;
            })
            .attr( "fill", function ( d ) {
                return c( d.key );
            })
            .each( function () {
                this.addEventListener( "mouseenter", mouseEnter )
                this.addEventListener( "mouseleave", mouseLeave )
            })

        rects
            .transition()
            .attr( "y", function ( d ) {
                return y.range()[ 1 ] - y( d.values.y ) - y( d.values.y0 )
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

    function mouseEnter ( ev ) {
        d3.select( this )
            .transition()
            .style( "opacity", .7 )
    }

    function mouseLeave ( ev ) {
        d3.select( this )
            .transition()
            .style( "opacity", 1 )
    }

    function xlabels ( x, y ) {
        var h = y.range()[ 1 ] - y.range()[ 0 ];
        var w = x.rangeBand() / 2;
        return function ( groups ) {
            var labels = groups.selectAll( "text" )
                .data( function ( d ) { return [ d ] } )

            labels.enter().append( "text" );
            labels.exit().remove();
            labels
                .text( function ( d ) { return d.key })
                .style( "font", "12px roboto_condensedregular" )
                .style( "fill", "white" )
                .attr( "text-anchor", "middle" )
                .attr( "transform", function ( d ) {
                    return "translate(" + w + "," + ( h - 3 ) + ")"
                })

            // side-effect: modify the y-range to leave space for the label
            var maxh = d3.max( labels, function ( text ) {
                return text[ 0 ].offsetHeight;
            })

            maxh += maxh ? 4 : 0;
            y.rangeRound([ 
                y.range()[ 0 ] + maxh, 
                y.range()[ 1 ] 
            ])
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

    function alias ( name ) {
        return function () {
            return this[ name ].apply( this, arguments );
        }
    }


})();
