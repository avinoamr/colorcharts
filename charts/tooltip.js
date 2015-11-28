(function () {
    var color = window.color;
    var getset = color.getset;

    var Opentip = window.Opentip;
    if ( !Opentip ) {
        Opentip = function () {}
        Opentip.prototype.setContent = function () {}
        Opentip.styles = {};
    }
    
    Opentip.styles.colorDark = {
        "extends": "dark",
        borderWidth: false,
        background: "rgba(0,0,0,.4)",
        shadowColor: "rgba(0, 0, 0, 0.15)",
        stemLength: 3,
        borderRadius: 15,
    };

    color.tooltip = function () {
        var options = {
            value: null,
            label: null,
            title: null,
            y: null,
            v: null,
            data: null,
        }

        function tooltip ( el ) { return tooltip.draw( this ) }
        tooltip.title = getset( options, "title" );
        tooltip.content = getset( options, "content" );
        tooltip.data = getset( options, "data" );
        tooltip.draw = function ( selection ) {
            if ( selection instanceof Element ) {
                selection = d3.selectAll( [ selection ] );
            }

            selection.each( function ( data ) { 
                var data = layout( tooltip, tooltip.data() || data );
                draw( tooltip, this, data );  
            })
            return this;
        }

        return tooltip;
    }

    function layout ( that, data ) {
        var title = that.title();
        if ( typeof title == "function" ) {
            title = title( data )
        }

        var content = that.content();
        if ( typeof content == "function" ) {
            content = content( data );
        }

        return { title: title, content: content };
    }

    function draw( that, el, data ) {
        el = d3.select( el );
        var node = el.node();
        if ( !node.__tooltip ) {
            node.__tooltip = new Opentip( node, "", {
                showOn: "mouseover",
                removeElementsOnHide: true
            })
        }
        el.node().__colorchart = that;

        var html = [
            "<h3 style='margin: 0'>" + data.title + "</h3>",
            data.content
        ].join( "<br />" )
        node.__tooltip.setContent( html )
    }

})();
