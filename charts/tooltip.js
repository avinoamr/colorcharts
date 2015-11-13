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
        }

        function tooltip ( el ) { tooltip.draw( el ) }
        tooltip.value = getset( options, "value" );
        tooltip.label = getset( options, "label" );
        tooltip.draw = function ( els ) {
            var el = els.node ? els.node() : els;
            this.__svg = color.selectUp( el, "svg" )

            els.each( function () {
                if ( !this.__tooltip ) {
                    d3.select( this )
                        .on( "mouseenter", mouseEnter )
                        .on( "mouseleave", mouseLeave );
                }

                this.__tooltip = tooltip;
            })

            return this;
        }

        return tooltip;
    }

    function mouseEnter( d ) {
        var that = this.__tooltip;
        var svg = that.__svg;

        if ( !svg.__tip ) {
            svg.__tip = new Opentip( this, "TEXT?", { 
                showOn: "creation", 
                hideOn: "null",
                removeElementsOnHide: true 
            })
        }

        var label = that.label();
        label = typeof label == "function" ? label( d ) : d[ label ];
        svg.__tip.setContent( label );
        svg.__tip.prepareToShow();
    }

    function mouseLeave( ev ) {
        var tooltip = this.__tooltip;
        var svg = tooltip.__svg;
        svg.__tip.prepareToHide();
    }

})();
