(function () {
    var color = window.color;
    var getset = color.getset;

    color.hoverpoints = function () {
        var options = {
            x: null,
            y: null,
            color: null,
            data: null,
            duration: 50,
            radius: 8,
            distance: 40,
            tooltip: color.tooltip()
                .title( function ( data ) {
                    return data[ 0 ].point.x
                })
        }

        function hoverpoints( el ) { return hoverpoints.draw( this ) }
        hoverpoints.x = getset( options, "x" );
        hoverpoints.y = getset( options, "y" );
        hoverpoints.color = getset( options, "color" );
        hoverpoints.duration = getset( options, "duration" );
        hoverpoints.radius = getset( options, "radius" );
        hoverpoints.distance = getset( options, "distance" );
        hoverpoints.tooltip = getset( options, "tooltip" );
        hoverpoints.data = getset( options, "data" );
        hoverpoints.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( hoverpoints, hoverpoints.data() || data );
                draw( hoverpoints, this, data ); 
            })
            return this;
        }

        return hoverpoints;
    }

    function draw( that, el, data ) {
        el = d3.select( el );
        var svg = color.selectUp( el, "svg" );

        if ( el.attr( "data-color-chart" ) != "hoverpoints" ) {
            el.attr( "data-color-chart", "hoverpoints" )
                .text( "" );
        }

        if ( !svg.__hoverpoints ) {
            svg.addEventListener( "mousemove", mouseMove );
        }

        svg.__hoverpoints = that;
        that._el = el;
        that._xdata = data;
    }

    function mouseMove ( ev ) {
        var rect = this.getBoundingClientRect()
        var that = this.__hoverpoints;
        var x = that.x();
        var y = that.y();
        var c = that.color();
        var tooltip = that.tooltip();
        var distance = that.distance();
        var radius = that.radius();
        var duration = that.duration();

        var mx = ev.clientX - rect.left;
        var my = ev.clientY - rect.top;

        // binary search for the closest x-coordinate in the dataset
        // this is a large dataset, containing possibly thousands of 
        // x-coordinates, so it must be fast
        var data = that._xdata;
        var ci0 = 0, ci1 = data.length, ci;
        do {
            ci = ci0 + Math.floor( ( ci1 - ci0 ) / 2 )
            if ( mx > data[ ci ].x ) {
                ci0 = ci;
            } else {
                ci1 = ci;
            }
        } while ( ci1 - ci0 > 1 );

        ci = data[ ci1 ].x - mx > mx - data[ ci0 ].x ? ci0 : ci1;
        var cx = data[ ci ].x;

        // build the list of all points for the given x-coordinate
        // this is a much smaller dataset containing only a single x-coord
        // side-effect: determine if any of these points are close enough to the
        // cursor, to determine if all of the points should be highlighted or not
        var points = [], closeEnough = false;
        for ( var i = 0 ; i < data[ ci ].length ; i += 1 ) {
            var point = data[ ci ][ i ];

            // add the point to the highlight list
            points.push( point );

            // are we close enough?
            // pythagoras distance between the cursor and the point
            var dx = Math.abs( point.x - mx );
            var dy = Math.abs( point.y - my );
            var dist = Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
            closeEnough = closeEnough || dist < distance
        }

        if ( !closeEnough ) {
            points = [];
        }

        // draw the points
        var hoverpoints = that._el.selectAll( "g[data-hoverpoint]" )
            .data( points, function ( d ) {
                return [ d.x, d.y ].join( "-" )
            });
        hoverpoints.exit().remove();
        hoverpoints.enter().append( "g" )
            .attr( "data-hoverpoint", function ( d ) {
                return [ d.x, d.y ].join( "-" )
            })
            .attr( "transform", function ( d ) {
                return "translate(" + d.x + "," + d.y + ")";
            })

        // actual point circles
        var points = hoverpoints.selectAll( "circle[data-hoverpoints-point]" )
            .data( function ( d ) { return [ d ] } )
        points.exit().remove();
        points.enter().append( "circle" )
            .attr( "data-hoverpoints-point", "" )
            .attr( "r", 0 )
            .attr( "fill", function ( d ) {
                return d.c
            })
        points.transition()
            .duration( duration )
            .attr( "r", function ( d ) {
                return d.point.obj ? radius : 0
            });

        // hover-area
        var hover = hoverpoints.selectAll( "circle[data-hoverpoints-hover" )
            .data( function ( d ) { 
                return [ data[ ci ] ] 
            });
        hover.exit()
            .remove()
        hover.enter().append( "circle" )
            .attr( "data-hoverpoints-hover", "" )
            .attr( "fill", "transparent" )
            .attr( "r", distance )
            .call( tooltip );
    }

    function layout( that, data ) {
        // transpose the data to be searchable by x-coordinate
        var x = that.x(), y = that.y(), c = that.color();
        var xdata = [], map = {};
        data.forEach( function ( series ) {
            series.forEach( function ( d ) {
                var dx = x( d.x );
                if ( !map[ dx ] ) {
                    xdata.push( map[ dx ] = [] );
                    map[ dx ].x = dx;
                }
                map[ dx ].push({ 
                    x: dx, 
                    y: y( d.y ), 
                    c: c( series.key ), 
                    point: d 
                })
            })
        })

        return xdata;
    }

})();
