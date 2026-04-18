import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import SmartLinkHubPage from './SmartLinkHubPage';

describe('SmartLinkHubPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the composer and empty workspace', () => {
    render(
      <MemoryRouter>
        <SmartLinkHubPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /turn saved internet links into usable knowledge/i })).toBeInTheDocument();
    expect(screen.getByText(/quick add composer/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste clipboard/i })).toBeInTheDocument();
  });

  it('switches into the library view', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SmartLinkHubPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /library/i }));
    expect(await screen.findByPlaceholderText(/search by keyword, meaning, category, or memory/i)).toBeInTheDocument();
  });
});
