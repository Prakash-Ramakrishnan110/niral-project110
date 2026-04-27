<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" 
    xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
    xmlns="http://www.opengis.net/sld" 
    xmlns:ogc="http://www.opengis.net/ogc" 
    xmlns:xlink="http://www.w3.org/1999/xlink" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>land_parcels_style</Name>
    <UserStyle>
      <Title>TN Land Records Style</Title>
      <FeatureTypeStyle>
        
        <!-- Waterbodies (Blue) -->
        <Rule>
          <Title>Waterbody</Title>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>classification</ogc:PropertyName>
              <ogc:Literal>Waterbody</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#0ea5e9</CssParameter>
              <CssParameter name="fill-opacity">0.6</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#0284c7</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>

        <!-- Government Land (Red/Critical) -->
        <Rule>
          <Title>Government</Title>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>classification</ogc:PropertyName>
              <ogc:Literal>Government</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#ef4444</CssParameter>
              <CssParameter name="fill-opacity">0.4</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#b91c1c</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>

        <!-- Private Land (Green) -->
        <Rule>
          <Title>Private</Title>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>classification</ogc:PropertyName>
              <ogc:Literal>Private</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#22c55e</CssParameter>
              <CssParameter name="fill-opacity">0.3</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#16a34a</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>

      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
