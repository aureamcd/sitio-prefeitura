export default function VLibras() {
  return (
    <div suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          <div vw class="enabled">
            <div vw-access-button class="active"></div>
            <div vw-plugin-wrapper>
              <div class="vw-plugin-top-wrapper"></div>
            </div>
          </div>

          <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
          <script>
            new VLibras.Widget('https://vlibras.gov.br/app');
          </script>
        `,
      }}
    />
  );
}
