<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
    <html>
        <head>
            <script>
                /* 1. Define the source */
                const src = "https://fastly.jsdelivr.net/npm/galactic-lite@latest/";
                
                /* 2. Fetch and Inject */
                fetch(src + "index.html")
                    .then(res => res.text())
                    .then(html => {
                        const patchedHtml = html.replace("&lt;head&gt;", `&lt;head&gt;&lt;base href="${src}"&gt;`);
                        document.open();
                        document.write(patchedHtml);
                        document.close();
                    });
            </script>
        </head>
        <body style="background:#000;"></body>
    </html>
</xsl:template>
</xsl:stylesheet>
