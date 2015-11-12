(function () {
    var color = window.color;
    var getset = color.getset;
    
    color.numbers = function () {
        var options = {
            data: null,
            key: "key",
            value: "value",
        };

        function numbers( el ) { return numbers.draw( el ) }
        numbers.key = getset( options, "key" )
        numbers.value = getset( options, "value" )
        numbers.data = getset( options, "data" );
        numbers.draw = function ( el ) {
            draw( this, el );
            return this;
        }

        return numbers;
    }

    function draw( that, el ) {
        if ( !el.node() ) {
            return; // no parent
        }

        // read the data, either from the legend or the element
        var data = that.data() || el.datum();

        // extract the values for each obj
        data = data.map( function ( d ) {
            return { k: d[ that.key() ], v: d[ that.value() ] }
        })

        var numbers = el.selectAll( "g[data-numbers]" )
            .data( data );
        numbers.exit().remove()
        numbers.enter().append( "g" )
            .attr( "data-numbers", function ( d ) { return d.k } );

        var y = 0, x = 0;
        numbers.each( function ( d ) {
            var number = d3.select( this )
                .attr( "transform", "translate(" + x + "," + y + ")" );

            var value = number.selectAll( "text[data-numbers-value]" )
                .data( [ d ] );
            value.enter().append( "text" )
                .attr( "data-numbers-value", "" )
                .attr( "alignment-baseline", "hanging" )
                .style( "font", "22px sans-serif" )
                .style( "fill", "white" )
                .style( "font-weight", "bold" )
            value.text( function ( d ) { return d.v } )

            var height = value.node().offsetHeight;

            var key = number.selectAll( "text[data-numbers-key]" )
                .data( [ d ] );
            key.enter().append( "text" )
                .attr( "data-numbers-key", "" )
                .attr( "alignment-baseline", "hanging" )
                .style( "font", "11px sans-serif" )
                .style( "fill", "white" )
                .style( "opacity", .4 )
                .style( "font-weight", "200" )
            key.text( function ( d ) { return d.k } )
                .attr( "transform", "translate(0," + height + ")" );

            height += key.node().offsetHeight;
            y += height + 8
        })
    }

})();
