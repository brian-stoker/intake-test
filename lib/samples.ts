// The three messy input shapes from the PRD appendix. One code path handles all.
export const samples: { label: string; value: string }[] = [
  {
    label: "Messy email",
    value: `Fwd: hey saw your truck — got a leak under the kitchen sink thats been
dripping all weekend, getting worse. can someone come thurs or fri? not
trying to spend a fortune lol. call me 407-555-0148 -mike`,
  },
  {
    label: "Voicemail transcript",
    value: `uh yeah hi this is uh Denise um I think my AC unit just died it's like
90 degrees in here and I've got my kids home so this is kind of an
emergency um you can reach me at denise dot r at gmail whenever thanks bye`,
  },
  {
    label: "Broken CSV row",
    value: `name,phone,notes
"Carlos R.",,"wants quote for driveway resurfacing ~600 sq ft, flexible
on timing, asked if we do payment plans"`,
  },
];
