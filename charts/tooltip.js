(function () {
    var color = window.color;
    var getset = color.getset;

    var colorDark = {
        "extends": "dark",
        borderWidth: false,
        background: "rgba(0,0,0,.4)",
        shadowColor: "rgba(0, 0, 0, 0.15)",
        stemLength: 3,
        borderRadius: 15,
    }

    if ( window.Opentip ) {
        window.Opentip.styles.colorDark = colorDark;
    }

    color.tooltip = function () {
        var options = {
            value: null,
            label: null,
            title: null,
            y: null,
            v: null,
        }

        function tooltip ( el ) { return tooltip.draw( this ) }
        tooltip.title = getset( options, "title" );
        tooltip.content = getset( options, "content" );
        tooltip.color = getset( options, "c" );
        tooltip.draw = function ( selection ) {
            var chart = this;
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                draw( chart, this ) 
            })
            return this;
        }

        return tooltip;
    }

    function draw( that, el ) {
        el = d3.select( el );

        var d = el.datum();
        var title = that.title();
        if ( typeof title == "function" ) {
            title = title( d )
        }

        var content = that.content();
        if ( typeof content == "function" ) {
            content = content( d );
        }

        var node = el.node();
        if ( !node.__tooltip ) {
            node.__tooltip = new Opentip( node, "", {
                showOn: "mouseover",
                removeElementsOnHide: true
            })
        }

        var html = [
            "<h3 style='margin: 0'>" + title + "</h3>",
            content
        ].join( "<br />" )
        node.__tooltip.setContent( html )
    }

})();
