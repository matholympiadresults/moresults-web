import { useDatabase } from "@/hooks/api";
import { Award } from "@/schemas/base";
import { calculateDataStats } from "@/utils/dataStats";
import {
  Container,
  Title,
  Text,
  Stack,
  Alert,
  Table,
  Paper,
  Group,
  Loader,
  SimpleGrid,
  ActionIcon,
} from "@mantine/core";
import { IconInfoCircle, IconBrandGithub, IconMail } from "@tabler/icons-react";
import { useMemo } from "react";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="xl" fw={700}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
    </Paper>
  );
}

export function Data() {
  const { data, loading, error } = useDatabase();

  const stats = useMemo(() => {
    if (!data) return null;
    return calculateDataStats(data);
  }, [data]);

  if (loading) {
    return (
      <Container size="lg">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg">
        <Alert color="red" title="Error loading data">
          {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title>Data</Title>
          <Text c="dimmed" size="lg">
            About our data sources
          </Text>
        </Stack>

        <Alert
          icon={<IconInfoCircle size={20} />}
          title="About this project"
          variant="light"
        >
          <Text size="sm">
            We provide a consolidated view on all major publicly available
            international math olympiads that have at least 10 teams
            participating. Our goal is to deliver a high-performance database of
            competition results, contestant histories, and country statistics
            across multiple olympiads.
          </Text>
        </Alert>

        <Stack gap="md">
          <Title order={3}>Official Data Sources</Title>
          <Text c="dimmed" size="sm">
            All data is mirrored from the following official olympiad websites.
          </Text>
          <Paper withBorder>
            <Table>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={500}>IMO</Table.Td>
                  <Table.Td>
                    <a href="https://www.imo-official.org/" target="_blank" rel="noopener noreferrer">
                      imo-official.org
                    </a>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>EGMO</Table.Td>
                  <Table.Td>
                    <a href="https://www.egmo.org/" target="_blank" rel="noopener noreferrer">
                      egmo.org
                    </a>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>MEMO</Table.Td>
                  <Table.Td>
                    <a href="https://www.memo-official.org/" target="_blank" rel="noopener noreferrer">
                      memo-official.org
                    </a>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>RMM</Table.Td>
                  <Table.Td>
                    <a href="https://rmms.lbi.ro/" target="_blank" rel="noopener noreferrer">
                      rmms.lbi.ro
                    </a>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>APMO</Table.Td>
                  <Table.Td>
                    <a href="https://www.apmo-official.org/" target="_blank" rel="noopener noreferrer">
                      apmo-official.org
                    </a>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>BMO</Table.Td>
                  <Table.Td c="dimmed">
                    No single website (hosted on different sites each year)
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>PAMO</Table.Td>
                  <Table.Td>
                    <a href="https://www.pamoofficial.org/" target="_blank" rel="noopener noreferrer">
                      pamoofficial.org
                    </a>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={500}>Baltic Way</Table.Td>
                  <Table.Td>
                    <a
                      href="https://www.math.olympiaadid.ut.ee/eng/html/?id=bw"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      math.olympiaadid.ut.ee
                    </a>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>

        <Alert
          icon={<IconInfoCircle size={20} />}
          title="Privacy"
          variant="light"
        >
          <Stack gap="xs">
            <Text size="sm">
              <strong>Contact:</strong>{" "}
              <a href="mailto:math.olympiad.results@gmail.com">
                math.olympiad.results@gmail.com
              </a>
            </Text>
            <Text size="sm">
              <strong>Data Redaction:</strong> This website is a mirror of official records.
              If you would like your name redacted, please contact the respective olympiad
              committee to have the official results updated. Once their site is updated,
              our system will reflect that change on the next sync.
            </Text>
          </Stack>
        </Alert>

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

        {stats && (
          <>
            <Stack gap="md">
              <Title order={3}>Database Summary</Title>
              <Text size="sm" c="dimmed">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </Text>

              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <StatCard label="Countries" value={stats.countries} />
                <StatCard label="Competitions" value={stats.competitions} />
                <StatCard label="People" value={stats.people} />
                <StatCard label="Participations" value={stats.participations} />
              </SimpleGrid>
            </Stack>

            <Stack gap="md">
              <Title order={3}>Participations by Olympiad</Title>
              <Text c="dimmed" size="sm">
                A participation is one person (or team) competing in one competition.
              </Text>
              <Paper withBorder>
                <Table>
                  <Table.Tbody>
                    {Object.entries(stats.byOlympiad)
                      .filter(([, count]) => count > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => (
                        <Table.Tr key={source}>
                          <Table.Td fw={500}>{source}</Table.Td>
                          <Table.Td ta="right">
                            {count.toLocaleString()}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>

            <Stack gap="md">
              <Title order={3}>Year Coverage</Title>
              <Text c="dimmed" size="sm">
                Overall: {stats.minYear} - {stats.maxYear} ({stats.yearSpan}{" "}
                years)
              </Text>
              <Paper withBorder>
                <Table>
                  <Table.Tbody>
                    {Object.entries(stats.yearsByOlympiad)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([source, coverage]) => (
                        <Table.Tr key={source}>
                          <Table.Td fw={500}>{source}</Table.Td>
                          <Table.Td ta="right">{coverage}</Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>

            <Stack gap="md">
              <Title order={3}>Awards</Title>
              <Paper withBorder>
                <Table>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={500}>🥇 Gold</Table.Td>
                      <Table.Td ta="right">
                        {stats.awards[Award.GOLD].toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>🥈 Silver</Table.Td>
                      <Table.Td ta="right">
                        {stats.awards[Award.SILVER].toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>🥉 Bronze</Table.Td>
                      <Table.Td ta="right">
                        {stats.awards[Award.BRONZE].toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>📜 Honourable Mention</Table.Td>
                      <Table.Td ta="right">
                        {stats.awards[Award.HONOURABLE_MENTION].toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>— No Award</Table.Td>
                      <Table.Td ta="right">
                        {stats.noAward.toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </>
        )}
      </Stack>
    </Container>
  );
}
