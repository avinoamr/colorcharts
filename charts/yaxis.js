(function () {
    var color = window.color;
    var getset = color.getset;

    color.yaxis = function () {
        var options = {
            inplace: false,
            enabled: true,
            x: null,
            y: null,
            data: null,
        };

        function yaxis () {
            return yaxis.draw( this );
        }

        yaxis.enabled = getset( options, "enabled" );
        yaxis.inplace = getset( options, "inplace" );
        yaxis.x = getset( options, "x" );
        yaxis.y = getset( options, "y" );
        yaxis.data = getset( options, "data" );
        yaxis.draw = function ( selection ) {
            if ( !this.enabled() ) {
                return
            }
            
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( yaxis, yaxis.data() || data );
                draw( yaxis, this, data );  
            })
            return this;
        }

        return yaxis;
    }

    function layout ( that, data ) {
        return data;
    }

    function draw ( that, el, data ) {
        return that.inplace() 
            ? drawInPlace( that, el, data )
            : drawAxis( that, el, data );
    }

    function drawInPlace ( that, el, data ) {
        var x = that.x();
        var y = that.y();

        data = flatten( data )
            .filter( function ( d ) {
                return Boolean( d.obj )
            });

        el = d3.select( el );
        var labels = el.selectAll( 'text[data-yaxis-label]' )
            .data( data )
        labels.exit().remove();
        labels.enter().append( "text" )
            .attr( 'data-yaxis-label', '' )
            .attr( "text-anchor", "middle" )
            .attr( "alignment-baseline", "hanging" )
            .style( "opacity", .6 );

        labels
            .text( function ( d ) {
                return d.y;
            })
            .attr( "transform", function ( d ) {
                var xv = x( d.x || d.x0 );
                var yv = y( d.y ) - 20;

                if ( x.rangeBand ) {
                    xv += x.rangeBand() / 2;
                }

                return "translate(" + xv + ',' + yv + ')';
            })

    }

    function drawAxis ( that, el, data ) {
        var x = that.x();
        var y = that.y();

        var width = x.range().slice( -1 )[ 0 ] - x.range()[ 0 ];
        if ( x.rangeBand ) {
            // handle range bands where the computed width is not including
            // the extra band width at the end.
            width += x.rangeBand();
        }

        var yAxis = d3.svg.axis()
            .scale( y )
            .orient( "left" )
            .tickSize( width, 0 )
            .ticks( 3 );

        var maxw = 0;
        el = d3.select( el );
        el.call( yAxis )
            .each( function ( d ) {
                d3.select( this )
                    .selectAll( "path.domain" )
                    .attr( "fill", "white" );
            })
            .selectAll( "g.tick" )
                .each( function () {
                    var tick = d3.select( this );
                    tick.select( "line" )
                        .attr( "stroke", "rgba(255,255,255,.1)" )
                    var text = tick.select( "text" )
                    maxw = Math.max( maxw, text.node().offsetWidth );
                });
        
        maxw = maxw ? maxw + 8 : 0; 
        el.attr( "transform", "translate(" + ( width + maxw ) + ",0)" );
    }

    function flatten ( data ) {
        if ( !Array.isArray( data ) ) {
            return data;
        }

        return data.reduce( function ( data, d ) {
            return data.concat( flatten( d ) );
        }, [] )
    }


})();