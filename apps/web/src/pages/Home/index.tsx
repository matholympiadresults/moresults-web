import { ROUTES } from "@/constants/routes";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Group,
  ThemeIcon,
  Stack,
  Alert,
  ActionIcon,
} from "@mantine/core";
import {
  IconUsers,
  IconTrophy,
  IconFlag,
  IconScale,
  IconMedal,
  IconDatabase,
  IconBrandGithub,
  IconMail,
} from "@tabler/icons-react";
import { NavLink } from "react-router";

interface QuickLinkProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function QuickLink({ to, icon, title, description }: QuickLinkProps) {
  return (
    <Card
      component={NavLink}
      to={to}
      padding="lg"
      radius="md"
      withBorder
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon size="xl" radius="md" variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={4}>
          <Text fw={500}>{title}</Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

export function Home() {
  return (
    <Container size="lg">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title>Explore Consolidated Math Olympiad Results</Title>
          <Text c="dimmed" size="lg">
            This website is a mirror of official records from different
            international olympiads.
          </Text>
        </Stack>

        <Stack gap="md">
          <Title order={3}>Quick Links</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <QuickLink
              to={ROUTES.CONTESTANTS}
              icon={<IconUsers size={24} />}
              title="Contestants"
              description="Browse all contestants and their participation history"
            />
            <QuickLink
              to={ROUTES.COMPETITIONS}
              icon={<IconTrophy size={24} />}
              title="Competitions"
              description="View competition results by olympiad and year"
            />
            <QuickLink
              to={ROUTES.COUNTRIES_INDIVIDUAL}
              icon={<IconFlag size={24} />}
              title="Countries"
              description="Country statistics and performance rankings"
            />
            <QuickLink
              to={ROUTES.COUNTRIES_COMPARE}
              icon={<IconScale size={24} />}
              title="Compare Countries"
              description="Side-by-side comparison of country performances"
            />
            <QuickLink
              to={ROUTES.HALL_OF_FAME}
              icon={<IconMedal size={24} />}
              title="Hall of Fame"
              description="Top performers across all competitions"
            />
            <QuickLink
              to={ROUTES.DATA}
              icon={<IconDatabase size={24} />}
              title="Data"
              description="About our data sources and methodology"
            />
          </SimpleGrid>
        </Stack>

        <Alert variant="light" title="Help us improve">
          <Group justify="space-between" align="center">
            <Text size="sm">
              Found a bug, missing data, or an olympiad we should add? Have
              suggestions or want to contribute? We'd love to hear from you!
            </Text>
            <Group gap="xs">
              <ActionIcon
                component="a"
                href="mailto:math.olympiad.results@gmail.com"
                variant="subtle"
                size="lg"
                aria-label="Email"
              >
                <IconMail size={20} />
              </ActionIcon>
              <ActionIcon
                component="a"
                href="https://github.com/matholympiadresults/moresults-web"
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                size="lg"
                aria-label="GitHub"
              >
                <IconBrandGithub size={20} />
              </ActionIcon>
            </Group>
          </Group>
        </Alert>
      </Stack>
    </Container>
  );
}
