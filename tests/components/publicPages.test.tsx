import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { describe, expect, it } from 'vitest';

import App from '../../src/App';
import { HomePage } from '../../src/pages/HomePage';
import { MapPage } from '../../src/pages/MapPage';
import { ProductPage } from '../../src/pages/ProductPage';
import { TreasuresPage } from '../../src/pages/TreasuresPage';
import { TutorialPage } from '../../src/pages/TutorialPage';
import { WelcomePage } from '../../src/pages/WelcomePage';

function renderPage(page: JSX.Element): string {
  return renderToStaticMarkup(<StaticRouter location="/">{page}</StaticRouter>);
}

describe('public frontend pages', () => {
  it('renders the documented Welcome, Kingdom, and CUKI destination screens', () => {
    const welcomeMarkup = renderPage(<WelcomePage />);

    expect(welcomeMarkup).toContain('GERBANG');
    expect(welcomeMarkup).toContain('PALEMBANG DARUSSALAM');
    expect(welcomeMarkup).toContain('Selamat datang di Kesultanan Palembang Darussalam');
    expect(welcomeMarkup).toContain('Membuka gerbang...');
    expect(welcomeMarkup).toContain('Menyiapkan pengalaman terbaik untukmu');

    const homeMarkup = renderPage(<HomePage />);

    expect(homeMarkup).toContain('Warisan Sriwijaya');
    expect(homeMarkup).toContain('Mulai Bermain');
    expect(homeMarkup).toContain('Logo CUKI Sriwijaya');
    expect(homeMarkup).toContain('Treasures Sriwijaya');
    expect(homeMarkup).toContain('Main Game');

    expect(renderPage(<MapPage />)).toContain('Nusantara Maritim');
    expect(renderPage(<TutorialPage />)).toContain('Tutorial CUKI');
    const treasuresMarkup = renderPage(<TreasuresPage />);
    expect(treasuresMarkup).toContain('Pewaris Sriwijaya');
    expect(treasuresMarkup).toContain('Royal Collection');
    expect(treasuresMarkup).toContain('Nusantara Harmony');
    expect(treasuresMarkup).toContain('Heritage Guardian');
    expect(treasuresMarkup).toContain('Open Archive');
    expect(treasuresMarkup).toContain('3 / 8');
    const productMarkup = renderPage(<ProductPage />);
    expect(productMarkup).toContain('CUKI BOARD GAME');
    expect(productMarkup).toContain('Beli Sekarang');
    expect(productMarkup).toContain('Katalog Produk Sumatera Selatan');
    expect(productMarkup).toContain('Pempek Palembang');
    expect(productMarkup).toContain('Dukung Warisan Lokal');
  });

  it('opens the Welcome Gate at the root route', () => {
    const markup = renderToStaticMarkup(
      <StaticRouter location="/">
        <App />
      </StaticRouter>,
    );

    expect(markup).toContain('PALEMBANG DARUSSALAM');
  });

  it('opens dedicated archive detail routes with story and challenge content', () => {
    const markup = renderToStaticMarkup(
      <StaticRouter location="/treasures/harmony">
        <App />
      </StaticRouter>,
    );

    expect(markup).toContain('Nusantara Harmony');
    expect(markup).toContain('Jejak Akulturasi Islam Nusantara');
    expect(markup).toContain('Knowledge Challenge');
    expect(markup).toContain('+100 XP');
    expect(markup).toContain('Mulai Tantangan');
  });
});
