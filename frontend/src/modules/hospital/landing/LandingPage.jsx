import React from "react";
import { motion as Motion } from "framer-motion";
import { Link } from "react-router-dom";

const heroStats = [
  { value: "240+", label: "Hospitals connected" },
  { value: "12K+", label: "Emergencies coordinated" },
  { value: "8,900", label: "Blood units transferred" },
  { value: "99.9%", label: "Platform uptime" },
];

const featureCards = [
  {
    tone: "from-[#C0392B]/20 to-[#C0392B]/5",
    iconTone: "text-[#C0392B]",
    mark: "H",
    title: "Hospital availability network",
    body: "Real-time visibility into beds, ventilators, emergency intake, and facility readiness across the connected hospital network.",
  },
  {
    tone: "from-[#1F3A5F]/20 to-[#1F3A5F]/5",
    iconTone: "text-[#1F3A5F]",
    mark: "A",
    title: "Ambulance coordination",
    body: "Coordinate movement and intake faster with clearer routing, faster handoff visibility, and live operational updates.",
  },
  {
    tone: "from-[#2A9D8F]/20 to-[#2A9D8F]/5",
    iconTone: "text-[#2A9D8F]",
    mark: "B",
    title: "Blood network sync",
    body: "Track blood stock by group, raise requests instantly, and reduce delays in critical transfusion workflows.",
  },
  {
    tone: "from-[#E09F3E]/20 to-[#E09F3E]/5",
    iconTone: "text-[#E09F3E]",
    mark: "AI",
    title: "Smart coordination layer",
    body: "A single workflow for emergencies, transfers, and resource requests so nothing gets lost between hospitals.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Register your hospital",
    body: "Create your facility profile and join the connected response network in a few minutes.",
  },
  {
    step: "02",
    title: "Configure live inventory",
    body: "Set your initial resources and blood stock so your dashboard reflects operational readiness from day one.",
  },
  {
    step: "03",
    title: "Coordinate in real time",
    body: "Accept requests, route patients, and resolve emergencies from a single shared command interface.",
  },
];

const previewRows = [
  {
    label: "ICU beds",
    value: "14 / 28",
    tone: "bg-[#2A9D8F]",
    width: "72%",
  },
  {
    label: "Ventilators",
    value: "7 active",
    tone: "bg-[#1F3A5F]",
    width: "58%",
  },
  {
    label: "O+ blood",
    value: "18 units",
    tone: "bg-[#C0392B]",
    width: "81%",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const LandingPage = () => {
  const hasToken = Boolean(localStorage.getItem("token"));

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="border-b border-[rgba(31,58,95,0.08)] bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(192,57,43,0.12)] text-xl font-bold text-[#C0392B]">
              +
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5D738B]">
                MedSutra
              </p>
              <h1 className="text-xl font-bold text-[#1D2D41]">
                Hospital Network
              </h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm text-[#5D738B] transition hover:text-[#1D2D41]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[#5D738B] transition hover:text-[#1D2D41]"
            >
              How It Works
            </a>
            {hasToken ? (
              <Link to="/hospital/dashboard" className="btn-primary">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/hospital/login"
                  className="text-sm font-medium text-[#1F3A5F] transition hover:text-[#2A4A6F]"
                >
                  Login
                </Link>
                <Link to="/hospital/register" className="btn-primary">
                  Register Hospital
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-linear-to-br from-[#1F3A5F] via-[#2A4A6F] to-[#1F3A5F] px-6 py-24">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#2A9D8F] blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#C0392B] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <Motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-white"
          >
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              The thread that connects healthcare
            </span>
            <h2 className="mt-6 text-5xl font-bold leading-[1.05] md:text-6xl">
              Hospital coordination,
              <br />
              designed like the new prototype.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              MedSutra gives hospitals a live coordination layer for
              emergencies, resource requests, blood inventory, and patient
              transfers so the right care is reachable faster.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {hasToken ? (
                <Link
                  to="/hospital/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C0392B] px-8 py-4 font-semibold text-white shadow-xl transition hover:bg-[#A33327]"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/hospital/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C0392B] px-8 py-4 font-semibold text-white shadow-xl transition hover:bg-[#A33327]"
                  >
                    Register Hospital
                  </Link>
                  <Link
                    to="/hospital/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A9D8F] px-8 py-4 font-semibold text-white shadow-xl transition hover:bg-[#248277]"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm"
                >
                  <strong className="block text-2xl font-bold text-white">
                    {item.value}
                  </strong>
                  <span className="mt-1 block text-sm text-white/70">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="surface-card overflow-hidden rounded-4xl border border-white/10 bg-white shadow-2xl">
              <div className="border-b border-slate-200 bg-[#F8FAFC] px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5D738B]">
                      Hospital command preview
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-[#1D2D41]">
                      Apollo General Hospital
                    </h3>
                  </div>
                  <span className="rounded-full bg-[rgba(42,157,143,0.14)] px-3 py-1 text-xs font-semibold text-[#2A9D8F]">
                    Live Sync
                  </span>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  {previewRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl bg-[#EEF3F8] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[#1D2D41]">
                          {row.label}
                        </span>
                        <span className="text-sm font-semibold text-[#5D738B]">
                          {row.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white">
                        <div
                          className={`h-2 rounded-full ${row.tone}`}
                          style={{ width: row.width }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="rounded-2xl bg-[#1F3A5F] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                      Incoming priority
                    </p>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/8 p-4">
                      <p className="text-lg font-bold">Emergency #E-4821</p>
                      <p className="mt-1 text-sm text-white/75">
                        ICU bed requested from City General Medical.
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="rounded-full bg-[#C0392B] px-3 py-1 text-xs font-semibold">
                          High Priority
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                          4 min ago
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5D738B]">
                      Workflow
                    </p>
                    <ul className="mt-4 space-y-3">
                      {[
                        "Raise resource request",
                        "Notify network hospitals",
                        "Accept and route transfer",
                        "Close with audit trail",
                      ].map((item, index) => (
                        <li
                          key={item}
                          className="flex items-center gap-3 text-sm text-[#1D2D41]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF3F8] text-xs font-bold text-[#1F3A5F]">
                            {index + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5D738B]">
                      Response channels
                    </p>
                    <div className="mt-4 space-y-3">
                      {[
                        ["Blood network", "18 active requests"],
                        ["Patient transfers", "7 in progress"],
                        ["Emergency intake", "3 awaiting confirmation"],
                      ].map(([title, value]) => (
                        <div
                          key={title}
                          className="rounded-xl bg-[#F8FAFC] px-4 py-3"
                        >
                          <p className="text-sm font-medium text-[#1D2D41]">
                            {title}
                          </p>
                          <p className="mt-1 text-xs text-[#5D738B]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        </div>
      </section>

      <section id="features" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5D738B]">
              Core features
            </p>
            <h2 className="mt-4 text-4xl font-bold text-[#1D2D41]">
              One platform for the hospital side of emergency care.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-[#5D738B]">
              The landing page now follows the new UI language while still
              pointing into your existing hospital flows.
            </p>
          </div>

          <Motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {featureCards.map((card) => (
              <Motion.article
                key={card.title}
                variants={fadeUp}
                className="surface-card p-6 transition hover:-translate-y-1"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${card.tone}`}
                >
                  <span className={`text-xl font-bold ${card.iconTone}`}>
                    {card.mark}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#1D2D41]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5D738B]">
                  {card.body}
                </p>
              </Motion.article>
            ))}
          </Motion.div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#F7FAFC] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5D738B]">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold text-[#1D2D41]">
              Fast onboarding, clearer hospital coordination.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#5D738B]">
              The same current app behavior, now introduced through the
              prototype style system.
            </p>
          </div>

          <Motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            {howItWorks.map((item) => (
              <Motion.div
                key={item.step}
                variants={fadeUp}
                className="surface-card relative p-8"
              >
                <span className="absolute -top-5 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#C0392B] text-lg font-bold text-white shadow-lg">
                  {item.step}
                </span>
                <div className="mt-6 rounded-2xl bg-[#EEF3F8] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1F3A5F]">
                    Hospital workflow
                  </p>
                  <h3 className="mt-4 text-xl font-semibold text-[#1D2D41]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#5D738B]">
                    {item.body}
                  </p>
                </div>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </section>

      <section className="bg-linear-to-r from-[#C0392B] to-[#A33327] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl font-bold">
            Ready to connect your hospital?
          </h2>
          <p className="mt-5 text-lg text-white/85">
            Join MedSutra and move into the same hospital workflows you already
            have, now wrapped in the new UI system.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            {hasToken ? (
              <Link
                to="/hospital/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-semibold text-[#C0392B] shadow-lg transition hover:bg-slate-100"
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/hospital/register"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-semibold text-[#C0392B] shadow-lg transition hover:bg-slate-100"
                >
                  Register Hospital
                </Link>
                <Link
                  to="/hospital/login"
                  className="inline-flex items-center justify-center rounded-xl bg-[#2A9D8F] px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-[#248277]"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-[#1A1A1A] px-6 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-[#F8D0CB]">
                +
              </span>
              <div>
                <h3 className="text-xl font-bold">MedSutra</h3>
                <p className="text-sm text-white/60">
                  Hospital coordination platform
                </p>
              </div>
            </div>
            <p className="text-sm leading-7 text-white/65">
              The thread that connects healthcare operations when hospitals need
              live coordination the most.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
            <div className="space-y-2 text-sm text-white/65">
              <p>
                <a href="#features" className="transition hover:text-white">
                  Features
                </a>
              </p>
              <p>
                <a href="#how-it-works" className="transition hover:text-white">
                  How It Works
                </a>
              </p>
              <p>
                <Link to="/hospital/login" className="transition hover:text-white">
                  Login
                </Link>
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Hospital Routes</h4>
            <div className="space-y-2 text-sm text-white/65">
              <p>
                <Link to="/hospital/dashboard" className="transition hover:text-white">
                  Dashboard
                </Link>
              </p>
              <p>
                <Link to="/hospital/operations" className="transition hover:text-white">
                  Operations
                </Link>
              </p>
              <p>
                <Link
                  to="/hospital/blood-transfers"
                  className="transition hover:text-white"
                >
                  Blood Transfers
                </Link>
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold">Contact</h4>
            <p className="text-sm leading-7 text-white/65">
              Emergency hotline
              <br />
              <span className="text-xl font-semibold text-white">
                1800-MEDSUTRA
              </span>
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-8 text-center text-sm text-white/55">
          <p>© {new Date().getFullYear()} MedSutra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
