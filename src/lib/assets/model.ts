import type { ModelNode } from "@israellopezdeveloper/nn3d";

export const models: ModelNode[] = [
  {
    id: "jobs",
    label: "Jobs",
    layers: [
      {
        id: "job1",
        label: "Job 1",
        type: "projects",
        neurons: [
          { id: "project1", label: "Project 1", type: "project" },
          { id: "project2", label: "Project 2", type: "project" },
        ],
      },
      {
        id: "job2",
        label: "Job 2",
        type: "projects",
        neurons: [
          { id: "project1", label: "Project 1", type: "project" },
          { id: "project2", label: "Project 2", type: "project" },
          { id: "project3", label: "Project 3", type: "project" },
          { id: "project4", label: "Project 4", type: "project" },
          { id: "project5", label: "Project 5", type: "project" },
        ],
      },
      {
        id: "job3",
        label: "Job 3",
        type: "projects",
        neurons: [
          { id: "project1", label: "Project 1", type: "project" },
          { id: "project2", label: "Project 2", type: "project" },
          { id: "project3", label: "Project 3", type: "project" },
          { id: "project4", label: "Project 4", type: "project" },
        ],
      },
      {
        id: "job4",
        label: "Job 4",
        type: "projects",
        neurons: [
          { id: "project1", label: "Project 1", type: "project" },
          { id: "project2", label: "Project 2", type: "project" },
          { id: "project3", label: "Project 3", type: "project" },
          { id: "project4", label: "Project 4", type: "project" },
          { id: "project5", label: "Project 5", type: "project" },
          { id: "project6", label: "Project 6", type: "project" },
          { id: "project7", label: "Project 7", type: "project" },
          { id: "project8", label: "Project 8", type: "project" },
        ],
      },
      {
        id: "job5",
        label: "Job 5",
        type: "projects",
        neurons: [
          { id: "project1", label: "Project 1", type: "project" },
          { id: "project2", label: "Project 2", type: "project" },
          { id: "project3", label: "Project 3", type: "project" },
        ],
      },
      {
        id: "job6",
        label: "Job 6",
        type: "projects",
        neurons: [
          { id: "project1", label: "Project 1", type: "project" },
          { id: "project2", label: "Project 2", type: "project" },
          { id: "project3", label: "Project 3", type: "project" },
          { id: "project4", label: "Project 4", type: "project" },
          { id: "project5", label: "Project 5", type: "project" },
        ],
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    layers: [
      {
        id: "complementary",
        label: "Complementary",
        type: "complementary",
        neurons: [
          { id: "course1", label: "Course 1", type: "course" },
          { id: "course2", label: "Course 2", type: "course" },
        ],
      },
      {
        id: "university",
        label: "University",
        type: "university",
        neurons: [
          { id: "course1", label: "Course 1", type: "course" },
          { id: "course2", label: "Course 2", type: "course" },
          { id: "course3", label: "Course 3", type: "course" },
          { id: "course4", label: "Course 4", type: "course" },
        ],
      },
      {
        id: "languages",
        label: "Languages",
        type: "languages",
        neurons: [
          { id: "course1", label: "Course 1", type: "course" },
          { id: "course2", label: "Course 2", type: "course" },
          { id: "course3", label: "Course 3", type: "course" },
        ],
      },
    ],
  },
];
