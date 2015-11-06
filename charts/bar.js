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

    Bar.prototype.data = autodraw( getset( "_data" ) );
    Bar.prototype.x0 = autodraw( getset( "_x0" ) );
    Bar.prototype.x1 = autodraw( getset( "_x1", "" ) );
    Bar.prototype.x = alias( "x0" );
    Bar.prototype.y = autodraw( getset( "_y" ) );
    Bar.prototype.color = autodraw( getset( "_c" ) );

    // draw once
    Bar.prototype.draw = function () {
        this._drawing = setTimeout( this._draw.bind( this ) );
        return this;
    }

    // actual drawing
    Bar.prototype._draw = function () {
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

        // build the groups tree
        data = groupX0( that._data, that )
        
        // start drawing
        var x0 = d3.scale.ordinal()
            .domain( data.map( function ( d ) { return d.x0 } ) )
            .rangeRoundBands([ 0, width ], .1 );

        var x1 = data.map( function ( x0 ) {
            return x0.map( function ( x1 ) { return x1.x1 })
        })

        var x1 = d3.scale.ordinal()
            .domain( d3.merge( x1 ) )
            .rangeRoundBands( [ 0, x0.rangeBand() ], .01 )

        var c = data.map( function ( x0 ) {
            return x0.map( function ( x1 ) {
                return x1.map( function ( c ) { return c.c })
            })
        });
        c = d3.merge( d3.merge( c ) )
        var cmax = d3.max( c );
        var cmin = d3.min( c );

        if ( that._color.from && that._color.to ) {
            c = d3.scale.linear()
                .domain( [ cmin, cmax ] )
                .range( [ that._color.from, that._color.to ] )
        } else {
            var colors = that._color.colors || [ "red", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c" ];
            c = d3.scale.ordinal()
                .domain( c )
                .range( colors )
        }

        var y = data.map( function ( x0 ) {
            return x0.map( function ( x1 ) {
                return x1.map( function ( c ) { return c.y + c.y0 })
            })
        });
        y = d3.merge( d3.merge( y ) );
        var y = d3.scale.linear()
            .domain([ 0, d3.max( y ) ])
            // .rangeRound([ height, 0 ] );
            .rangeRound([ 0, height ] );

        var groups = svg.selectAll( "g" )
            .data( data )
            .enter().append( "g" )
            .attr( "data-group", function ( d ) {
                return d.x0;
            })

        groups.attr( "transform", function ( d ) {
            return "translate(" + x0( d.x0 ) + ",0)";
        })

        var bars = groups.selectAll( "g" )
            .data(function ( d ) { return d })
            .enter().append( "g" )
            .attr( "data-bar", function ( d ) {
                return d.x1;
            });

        bars.attr( "transform", function ( d ) {
            return "translate(" + x1( d.x1 ) + ",0)";
        })

        var rects = bars.selectAll( "rect" )
            .data( function ( d ) { return d })
            .enter().append( "rect" )

        rects
            .attr( "y", function ( d ) {
                return height - y( d.y ) - y( d.y0 )
            })
            .attr( "height", function ( d ) {
                return y( d.y );
            })
            .attr( "width", function ( d ) {
                return x1.rangeBand()
            })
            .attr( "fill", function ( d ) {
                return c( d.c );
            })
    }

    function groupX0 ( data, that ) {
        return data.reduce( function ( groups, d ) {
            var x0 = d[ that._x0 ];

            if ( !groups._map[ x0 ] ) {
                groups.push( groups._map[ x0 ] = extend([], {
                    x0: x0,
                }))
            }

            groups._map[ x0 ].push( d )
            return groups;
        }, extend( [], { _map: {} } ) )
        .map( function ( d ) {
            return extend( groupX1( d, that ), { x0: d.x0 } )
        })
    }

    function groupX1 ( data, that ) {
        return data.reduce( function ( groups, d ) {
            var x1 = d[ that._x1 ];

            if ( !groups._map[ x1 ] ) {
                groups.push( groups._map[ x1 ] = extend([], {
                    x1: x1
                }))
            }

            groups._map[ x1 ].push( d )
            return groups;
        }, extend( [], { _map: {} } ) )
        .map( function ( d ) {
            return extend( groupC( d, that ), { x1: d.x1 } )
        })
    }

    function groupC ( data, that ) {
        var y0 = 0;
        return data.reduce( function ( groups, d ) {
            var c = d[ that._color ];

            if ( !groups._map[ c ] ) {
                groups.push( groups._map[ c ] = extend([], {
                    c: c
                }))
            }

            groups._map[ c ].push( d )
            return groups;
        }, extend( [], { _map: {} } ) )
        .map( function ( d ) {
            d = extend( aggregateY( d, that ), { c: d.c, y0: y0 } )
            y0 += d.y;
            return d;
        })
        return data;
    }

    function aggregateY ( data, that ) {
        return data.reduce( function ( v, d ) {
            return { y: v.y + d[ that._y ] }
        }, { y: 0 } )
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