/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

import { MindMapData } from "./types";

export interface ExampleEntry {
  id: string;
  title: string;
  videoUrl: string;
  mindMapData: MindMapData;
}

// MindMapData for "Physics Explained (minutephysics style)"
const physicsExplainedData: MindMapData = {
  nodes: [
    { id: "physics_center", label: "Physics Explained", group: "center", shape: "ellipse", value: 10, title: "Core concepts from the 'minutephysics' style explanation." },
    // Newtonian Mechanics
    { id: "newton_main", label: "Newtonian Mechanics", group: "main", shape: "dot", value: 8, title: "Classical mechanics as described by Isaac Newton." },
    { id: "newton_force", label: "Force (F=ma)", group: "detail", shape: "dot", value: 5, title: "Force equals mass times acceleration." },
    { id: "newton_gravity", label: "Universal Gravitation", group: "detail", shape: "dot", value: 6, title: "Masses attract each other; Inverse-Square Law." },
    { id: "newton_orbits", label: "Planetary Orbits", group: "detail", shape: "dot", value: 4, title: "Planets orbit due to gravity (centripetal force)." },
    { id: "newton_mass_weight", label: "Mass vs. Weight", group: "detail", shape: "dot", value: 3, title: "Mass is amount of stuff, weight is force of gravity." },
    // Energy
    { id: "energy_main", label: "Energy & Work", group: "main", shape: "dot", value: 8, title: "Concepts of energy, its forms, and work." },
    { id: "energy_kinetic", label: "Kinetic Energy", group: "detail", shape: "dot", value: 5, title: "Energy of movement." },
    { id: "energy_potential", label: "Potential Energy", group: "detail", shape: "dot", value: 5, title: "Stored energy due to position or state." },
    { id: "energy_work", label: "Work (Force x Distance)", group: "detail", shape: "dot", value: 4, title: "Force applied over a distance." },
    { id: "energy_conservation", label: "Conservation of Energy", group: "detail", shape: "dot", value: 6, title: "Energy cannot be created or destroyed, only converted." },
    // Thermodynamics
    { id: "thermo_main", label: "Thermodynamics", group: "main", shape: "dot", value: 7, title: "Study of heat, work, temperature, and energy." },
    { id: "thermo_temperature", label: "Temperature", group: "detail", shape: "dot", value: 4, title: "Average kinetic energy of atoms/molecules." },
    { id: "thermo_entropy", label: "Entropy", group: "detail", shape: "dot", value: 6, title: "Measure of disorder; universe tends to higher entropy." },
    // Electromagnetism
    { id: "em_main", label: "Electromagnetism", group: "main", shape: "dot", value: 9, title: "Interaction of electric and magnetic fields." },
    { id: "em_charge", label: "Electric Charge (+/-)", group: "detail", shape: "dot", value: 5, title: "Fundamental property of matter." },
    { id: "em_current", label: "Electric Current", group: "detail", shape: "dot", value: 4, title: "Flow of electric charge (electrons)." },
    { id: "em_maxwell", label: "Maxwell's Equations", group: "detail", shape: "dot", value: 7, title: "Describe how electric and magnetic fields are generated and alter each other." },
    { id: "em_waves", label: "EM Waves (Light)", group: "detail", shape: "dot", value: 6, title: "Propagating waves of electric and magnetic fields." },
    // Atomic & Nuclear
    { id: "atomic_main", label: "Atomic & Nuclear Physics", group: "main", shape: "dot", value: 8, title: "Structure of atoms and their nuclei." },
    { id: "atomic_structure", label: "Atom Structure", group: "detail", shape: "dot", value: 5, title: "Nucleus (protons, neutrons) and electrons." },
    { id: "atomic_quarks", label: "Quarks", group: "detail", shape: "dot", value: 4, title: "Fundamental constituents of protons and neutrons." },
    { id: "atomic_radiation", label: "Radioactivity", group: "detail", shape: "dot", value: 5, title: "Spontaneous decay of unstable atomic nuclei." },
    { id: "atomic_fission_fusion", label: "Fission & Fusion", group: "detail", shape: "dot", value: 6, title: "Nuclear reactions releasing energy (E=mc²)." },
    // Relativity
    { id: "relativity_main", label: "Relativity (Einstein)", group: "main", shape: "dot", value: 9, title: "Einstein's theories of special and general relativity." },
    { id: "relativity_lightspeed", label: "Constant Speed of Light", group: "detail", shape: "dot", value: 6, title: "Speed of light in a vacuum is constant for all observers." },
    { id: "relativity_time_dilation", label: "Time Dilation", group: "detail", shape: "dot", value: 5, title: "Time passes differently for observers in relative motion." },
    { id: "relativity_spacetime", label: "Spacetime", group: "detail", shape: "dot", value: 7, title: "Gravity as curvature of spacetime caused by mass/energy." },
    { id: "relativity_emc2", label: "E=mc²", group: "detail", shape: "dot", value: 7, title: "Mass-energy equivalence." },
    // Quantum Mechanics
    { id: "qm_main", label: "Quantum Mechanics", group: "main", shape: "dot", value: 9, title: "Physics of the very small (atoms, particles)." },
    { id: "qm_quanta", label: "Quanta (Packets of Energy)", group: "detail", shape: "dot", value: 5, title: "Energy exists in discrete units." },
    { id: "qm_superposition", label: "Superposition", group: "detail", shape: "dot", value: 6, title: "Particles can exist in multiple states at once until measured." },
    { id: "qm_uncertainty", label: "Uncertainty Principle", group: "detail", shape: "dot", value: 6, title: "Cannot simultaneously know exact position and momentum." },
    { id: "qm_wave_particle", label: "Wave-Particle Duality", group: "detail", shape: "dot", value: 7, title: "Particles like photons can exhibit both wave and particle properties." },
  ],
  edges: [
    // Newtonian
    { from: "physics_center", to: "newton_main" },
    { from: "newton_main", to: "newton_force" }, { from: "newton_main", to: "newton_gravity" },
    { from: "newton_gravity", to: "newton_orbits", label: "explains" }, { from: "newton_main", to: "newton_mass_weight" },
    // Energy
    { from: "physics_center", to: "energy_main" },
    { from: "energy_main", to: "energy_kinetic" }, { from: "energy_main", to: "energy_potential" },
    { from: "energy_main", to: "energy_work" }, { from: "energy_main", to: "energy_conservation" },
    // Thermodynamics
    { from: "physics_center", to: "thermo_main" },
    { from: "thermo_main", to: "thermo_temperature" }, { from: "thermo_main", to: "thermo_entropy" },
    // Electromagnetism
    { from: "physics_center", to: "em_main" },
    { from: "em_main", to: "em_charge" }, { from: "em_main", to: "em_current" },
    { from: "em_main", to: "em_maxwell", label: "governed by" }, { from: "em_maxwell", to: "em_waves", label: "predicts" },
    // Atomic & Nuclear
    { from: "physics_center", to: "atomic_main" },
    { from: "atomic_main", to: "atomic_structure" }, { from: "atomic_structure", to: "atomic_quarks", label: "made of" },
    { from: "atomic_main", to: "atomic_radiation" }, { from: "atomic_main", to: "atomic_fission_fusion" },
    // Relativity
    { from: "physics_center", to: "relativity_main" },
    { from: "relativity_main", to: "relativity_lightspeed" }, { from: "relativity_main", to: "relativity_time_dilation" },
    { from: "relativity_main", to: "relativity_spacetime" }, { from: "relativity_main", to: "relativity_emc2" },
    { from: "atomic_fission_fusion", to: "relativity_emc2", label: "explained by" },
    // Quantum Mechanics
    { from: "physics_center", to: "qm_main" },
    { from: "qm_main", to: "qm_quanta" }, { from: "qm_main", to: "qm_superposition" },
    { from: "qm_main", to: "qm_uncertainty" }, { from: "qm_main", to: "qm_wave_particle" },
    { from: "em_waves", to: "qm_wave_particle", label: "exhibits" },
  ],
};


// MindMapData for Robert Greene's "The Best Way To Spend Your Youth"
const robertGreene20sData: MindMapData = {
  nodes: [
    { id: "rg_center", label: "Key to Your 20s: Two-Track Approach", group: "center", shape: "ellipse", value: 10, title: "Robert Greene's advice for a fulfilling 20s involves balancing two main life tracks." },
    { id: "rg_track1", label: "Track 1: Adventure & Openness", group: "main", shape: "dot", value: 8, title: "Embrace new experiences, have fun, and explore. Your 20s are a unique time for this." },
    { id: "rg_t1_detail_fun", label: "Have Fun, Be Open, Try Things", group: "detail", shape: "dot", value: 5, title: "Actively seek out adventures and diverse experiences." },
    { id: "rg_t1_detail_avoid_burnout", label: "Prevents Single-Track Burnout", group: "detail", shape: "dot", value: 5, title: "Keeps life engaging and avoids the soullessness of a purely pragmatic path." },
    { id: "rg_track2", label: "Track 2: Focused Skill Development", group: "main", shape: "dot", value: 8, title: "Simultaneously cultivate skills in an area you love and have a general direction for." },
    { id: "rg_t2_detail_direction", label: "Have a Direction (What You Love)", group: "detail", shape: "dot", value: 6, title: "Identify your passions (music, business, writing, tech, etc.) to guide skill development." },
    { id: "rg_t2_detail_learning", label: "Constant Learning & Skill Building", group: "detail", shape: "dot", value: 7, title: "Learning should be continuous and driven by excitement in your chosen field." },
    { id: "rg_t2_detail_funnel", label: "Funnel Adventures into Skills", group: "detail", shape: "dot", value: 6, title: "Experiences from Track 1 should ideally inform and enhance skills in Track 2." },
    { id: "rg_pitfall1", label: "Pitfall: Single-Track Life", group: "main", shape: "dot", value: 6, title: "Focusing solely on external pressures (e.g., high-paying job, specific career path) often leads to misery and burnout." },
    { id: "rg_pitfall2", label: "Pitfall: Too Many Unrelated Tracks", group: "main", shape: "dot", value: 6, title: "Trying countless unrelated things without focus leads to a lack of solid skills and aimless wandering by 30." },
    { id: "rg_goal30", label: "Goal/Outcome by Age 30", group: "main", shape: "dot", value: 9, title: "To have clarity, substantial skills, rich experiences, and be ready to advance significantly in your chosen path." },
    { id: "rg_advice_learning", label: "Core Advice: Constant Learning", group: "detail", shape: "dot", value: 7, title: "Learning new skills should be a primary activity, fueled by excitement." },
    { id: "rg_advice_discipline", label: "Core Advice: Discipline & Focus", group: "detail", shape: "dot", value: 7, title: "Balance openness with enough discipline to build tangible skills in your area of interest." },
  ],
  edges: [
    { from: "rg_center", to: "rg_track1", label: "component" },
    { from: "rg_center", to: "rg_track2", label: "component" },
    { from: "rg_center", to: "rg_goal30", label: "aims for" },
    { from: "rg_track1", to: "rg_t1_detail_fun", label: "involves" },
    { from: "rg_track1", to: "rg_t1_detail_avoid_burnout", label: "benefit" },
    { from: "rg_track2", to: "rg_t2_detail_direction", label: "requires" },
    { from: "rg_track2", to: "rg_t2_detail_learning", label: "emphasizes" },
    { from: "rg_track2", to: "rg_t2_detail_funnel", label: "method" },
    { from: "rg_center", to: "rg_pitfall1", label: "warns against" },
    { from: "rg_center", to: "rg_pitfall2", label: "warns against" },
    { from: "rg_center", to: "rg_advice_learning", label: "core principle" },
    { from: "rg_center", to: "rg_advice_discipline", label: "core principle" },
    { from: "rg_track2", to: "rg_advice_learning", label: "fuels" },
    { from: "rg_track2", to: "rg_advice_discipline", label: "needs" },
  ],
};


export const examplesData: ExampleEntry[] = [
  {
    id: "physics_explained_video",
    title: "Physics Explained (minutephysics style)",
    videoUrl: "https://youtu.be/ZAqIoDhornk?si=Y0MMqzkyAR9y1SJP",
    mindMapData: physicsExplainedData,
  },
  {
    id: "robert_greene_20s",
    title: "The Best Way To Spend Your Youth (Robert Greene)",
    videoUrl: "https://youtu.be/_f3xwMWrBSo?si=YldOEyQgu7ux6Nmn",
    mindMapData: robertGreene20sData,
  },
];
