import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CardDetailDto, CardListItemDto, ExternalCardDto } from '@digimon/contracts';
import {
  ApiError,
  EXTERNAL_CARD_SOURCE_URL,
  fetchCard,
  fetchCards,
  fetchExternalCards,
} from '../../lib/api/client';
import { cardsText } from '../../lib/i18n/es';
import { shouldSearchExternal } from './externalSearch';

function CardArt({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex aspect-[5/7] w-full items-center justify-center overflow-hidden rounded-t-xl bg-slate-950/60">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="px-2 text-center text-xs text-slate-500">{cardsText.noImage}</span>
      )}
    </div>
  );
}

function CardDetailView({ id, onBack }: { id: string; onBack: () => void }) {
  const detail = useQuery({
    queryKey: ['card', id],
    queryFn: () => fetchCard(id),
    retry: false,
  });

  const card: CardDetailDto | undefined = detail.data;
  const images = card?.images ?? [];
  const primary = images.find((image) => image.type === 'original') ?? images[0];
  const alternates = images.filter((image) => image !== primary);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-sky-500/40 hover:text-white"
      >
        ← {cardsText.back}
      </button>

      {detail.isPending ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          {cardsText.loading}
        </div>
      ) : null}

      {detail.isError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
          <p className="font-semibold">{cardsText.errorTitle}</p>
          <p className="mt-1">
            {detail.error instanceof Error ? detail.error.message : cardsText.errorTitle}
          </p>
          <button
            type="button"
            onClick={() => void detail.refetch()}
            className="mt-4 rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-100 hover:bg-rose-500/20"
          >
            {cardsText.retry}
          </button>
        </div>
      ) : null}

      {card ? (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="flex flex-col gap-4">
              {primary ? (
                <figure className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                  <img src={primary.url} alt={card.name} className="h-auto w-full object-contain" />
                  <figcaption className="px-3 py-2 text-xs text-slate-500">
                    {cardsText.mainArt}
                  </figcaption>
                </figure>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  {card.id}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {card.name}
                </h1>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                {card.rarity ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-500">
                      {cardsText.fields.rarity}
                    </dt>
                    <dd className="text-sm text-slate-200">{card.rarity}</dd>
                  </div>
                ) : null}
                {card.card_type ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-500">
                      {cardsText.fields.cardType}
                    </dt>
                    <dd className="text-sm text-slate-200">{card.card_type}</dd>
                  </div>
                ) : null}
                {typeof card.level === 'number' ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-500">
                      {cardsText.fields.level}
                    </dt>
                    <dd className="text-sm text-slate-200">{card.level}</dd>
                  </div>
                ) : null}
                {typeof card.dp === 'number' ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-500">
                      {cardsText.fields.dp}
                    </dt>
                    <dd className="text-sm text-slate-200">{card.dp}</dd>
                  </div>
                ) : null}
                {card.set?.code || card.set?.name ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-slate-500">
                      {cardsText.fields.set}
                    </dt>
                    <dd className="text-sm text-slate-200">
                      {[card.set.code, card.set.name].filter(Boolean).join(' · ')}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">
                    {cardsText.source}
                  </dt>
                  <dd className="font-mono text-xs text-slate-300">{card.source_id}</dd>
                </div>
              </dl>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {cardsText.officialText}
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">
                  {card.official_text || '—'}
                </p>
              </div>
            </div>
          </div>

          {alternates.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {cardsText.alternateArts}
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {alternates.map((image) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60"
                  >
                    <img
                      src={image.url}
                      alt={`${card.name} (${image.type})`}
                      loading="lazy"
                      className="h-auto w-full object-contain"
                    />
                    <figcaption className="px-3 py-2 text-xs text-slate-500">
                      {image.type}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

function CardResult({ card, onSelect }: { card: CardListItemDto; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(card.id)}
      className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 text-left transition hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-slate-900"
    >
      <CardArt src={card.image_url} alt={card.name} />
      <div className="flex flex-col gap-1 p-3">
        <p className="text-sm font-semibold text-white group-hover:text-sky-300">{card.name}</p>
        <p className="text-xs text-slate-400">
          {card.id}
          {card.set?.code ? ` · ${card.set.code}` : ''}
        </p>
        {card.rarity ? <p className="text-xs text-slate-500">{card.rarity}</p> : null}
      </div>
    </button>
  );
}

function ExternalStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}

function ExternalCardPanel({ card }: { card: ExternalCardDto }) {
  const effects = [
    { label: cardsText.effects.main, value: card.main_effect },
    { label: cardsText.effects.source, value: card.source_effect },
    { label: cardsText.effects.alt, value: card.alt_effect },
  ].filter(
    (effect): effect is { label: string; value: string } =>
      typeof effect.value === 'string' && effect.value.trim().length > 0,
  );

  return (
    <article className="rounded-xl border border-amber-500/25 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs font-semibold text-amber-300">{card.id}</span>
        <h3 className="text-base font-semibold text-white">{card.name}</h3>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {card.type ? <ExternalStat label={cardsText.fields.cardType} value={card.type} /> : null}
        {card.color ? <ExternalStat label={cardsText.fields.color} value={card.color} /> : null}
        {card.color2 ? <ExternalStat label={cardsText.fields.color2} value={card.color2} /> : null}
        {typeof card.level === 'number' ? (
          <ExternalStat label={cardsText.fields.level} value={card.level} />
        ) : null}
        {typeof card.dp === 'number' ? (
          <ExternalStat label={cardsText.fields.dp} value={card.dp} />
        ) : null}
        {typeof card.play_cost === 'number' ? (
          <ExternalStat label={cardsText.fields.playCost} value={card.play_cost} />
        ) : null}
        {typeof card.evolution_cost === 'number' ? (
          <ExternalStat label={cardsText.fields.evolutionCost} value={card.evolution_cost} />
        ) : null}
        {card.form ? <ExternalStat label={cardsText.fields.form} value={card.form} /> : null}
        {card.attribute ? (
          <ExternalStat label={cardsText.fields.attribute} value={card.attribute} />
        ) : null}
        {card.rarity ? <ExternalStat label={cardsText.fields.rarity} value={card.rarity} /> : null}
        {card.digi_type ? (
          <ExternalStat label={cardsText.fields.digiType} value={card.digi_type} />
        ) : null}
        {card.series ? <ExternalStat label={cardsText.fields.series} value={card.series} /> : null}
      </dl>

      {effects.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {effects.map((effect) => (
            <div
              key={effect.label}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {effect.label}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-200">
                {effect.value.trim()}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {card.set_name && card.set_name.length > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          <span className="uppercase tracking-wider text-slate-500">{cardsText.fields.sets}: </span>
          {card.set_name.join(' · ')}
        </p>
      ) : null}
    </article>
  );
}

function externalErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return cardsText.externalRateLimited;
    }
    if (error.status === 504) {
      return cardsText.externalTimeout;
    }
  }
  return cardsText.externalUnavailable;
}

export function CardsPage() {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cardsQuery = useQuery({
    queryKey: ['cards', query, page],
    queryFn: () => fetchCards({ q: query || undefined, page }),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const searchExternal = shouldSearchExternal({
    localSettled: !cardsQuery.isPending && !cardsQuery.isPlaceholderData,
    localOk: cardsQuery.isSuccess,
    total: cardsQuery.data?.meta.total ?? 0,
    page,
    term: query,
  });

  const externalQuery = useQuery({
    queryKey: ['cards-external', query],
    queryFn: () => fetchExternalCards(query),
    enabled: searchExternal,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(term.trim());
  }

  function handleClear() {
    setTerm('');
    setQuery('');
    setPage(1);
  }

  if (selectedId) {
    return <CardDetailView id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const meta = cardsQuery.data?.meta;
  const cards = cardsQuery.data?.cards ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {cardsText.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{cardsText.description}</p>
        <p className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs leading-5 text-sky-200">
          {cardsText.policy}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6"
      >
        <label
          htmlFor="card-search"
          className="text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          {cardsText.searchLabel}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="card-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={cardsText.searchPlaceholder}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-sky-400"
          >
            {cardsText.searchAction}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
          >
            {cardsText.clearAction}
          </button>
        </div>
      </form>

      {cardsQuery.isPending ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
          {cardsText.loading}
        </div>
      ) : null}

      {cardsQuery.isError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
          <p className="font-semibold">{cardsText.errorTitle}</p>
          <p className="mt-1">
            {cardsQuery.error instanceof Error ? cardsQuery.error.message : cardsText.errorTitle}
          </p>
          <button
            type="button"
            onClick={() => void cardsQuery.refetch()}
            className="mt-4 rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-100 hover:bg-rose-500/20"
          >
            {cardsText.retry}
          </button>
        </div>
      ) : null}

      {cardsQuery.isSuccess ? (
        <>
          <p className="text-sm text-slate-400">{cardsText.resultsLabel(meta?.total ?? 0)}</p>

          {cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {cards.map((card) => (
                <CardResult key={card.id} card={card} onSelect={setSelectedId} />
              ))}
            </div>
          ) : searchExternal ? null : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              {cardsText.empty}
            </div>
          )}

          {searchExternal ? (
            <section
              aria-label={cardsText.externalTitle}
              className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-200">
                  {cardsText.externalTitle}
                </h2>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                  {cardsText.externalBadge}
                </span>
              </div>

              <p className="text-xs leading-5 text-amber-100/80">
                {cardsText.externalAttribution}{' '}
                <a
                  href={EXTERNAL_CARD_SOURCE_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-amber-400/50 underline-offset-2 hover:text-amber-50"
                >
                  {cardsText.externalDocsLabel}
                </a>
              </p>

              {externalQuery.isPending ? (
                <p className="rounded-xl border border-amber-500/20 bg-slate-950/50 p-4 text-sm text-amber-100/80">
                  {cardsText.externalLoading}
                </p>
              ) : null}

              {externalQuery.isError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  <p>{externalErrorMessage(externalQuery.error)}</p>
                  <button
                    type="button"
                    onClick={() => void externalQuery.refetch()}
                    className="mt-3 rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-100 hover:bg-rose-500/20"
                  >
                    {cardsText.externalRetry}
                  </button>
                </div>
              ) : null}

              {externalQuery.isSuccess ? (
                externalQuery.data.cards.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {externalQuery.data.cards.map((card, index) => (
                      <ExternalCardPanel key={`${card.id}-${index}`} card={card} />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-amber-500/20 bg-slate-950/50 p-4 text-sm text-amber-100/80">
                    {cardsText.externalEmpty}
                  </p>
                )
              ) : null}
            </section>
          ) : null}

          {meta && meta.total_pages > 1 ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <button
                type="button"
                disabled={meta.prev === null}
                onClick={() => setPage(meta.prev ?? 1)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cardsText.prevPage}
              </button>
              <span className="text-xs uppercase tracking-wider text-slate-500">
                {cardsText.pageLabel(meta.page, meta.total_pages)}
              </span>
              <button
                type="button"
                disabled={meta.next === null}
                onClick={() => setPage(meta.next ?? meta.page)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cardsText.nextPage}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
