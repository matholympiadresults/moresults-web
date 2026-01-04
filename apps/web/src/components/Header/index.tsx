import { NAV_LINKS, ROUTES } from "@/constants/routes";
import {
  AppShell,
  Group,
  Title,
  NavLink as MantineNavLink,
  useMantineColorScheme,
  ActionIcon,
  Burger,
  Drawer,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { NavLink, Outlet, useLocation } from "react-router";
import { PerformanceMetrics } from "@/components/PerformanceMetrics";

interface HeaderNavLinkProps {
  link: (typeof NAV_LINKS)[number];
  isActive: boolean;
  onClick?: () => void;
}

function HeaderNavLink({ link, isActive, onClick }: HeaderNavLinkProps) {
  return (
    <MantineNavLink
      key={link.path}
      component={NavLink}
      to={link.path}
      label={link.label}
      active={isActive}
      noWrap
      onClick={onClick}
    />
  );
}

export function Layout() {
  const location = useLocation();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header p="xs">
        <Group justify="space-between" align="center" h="100%">
          <Group gap="sm" wrap="nowrap">
            <NavLink to={ROUTES.HOME} style={{ textDecoration: "none", color: "inherit" }}>
              <Title order={5}>Math Olympiad Results</Title>
            </NavLink>
          </Group>

          <Group wrap="nowrap" visibleFrom="md">
            {NAV_LINKS.map((link) => (
              <HeaderNavLink
                key={link.path}
                link={link}
                isActive={location.pathname.startsWith(link.path)}
              />
            ))}
          </Group>

          <Group wrap="nowrap" gap="xs">
            <ActionIcon
              variant="default"
              size="lg"
              onClick={toggleColorScheme}
              aria-label="Toggle color scheme"
            >
              {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="md" size="sm" />
          </Group>
        </Group>
      </AppShell.Header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="xs"
        padding="md"
        title="Navigation"
        hiddenFrom="md"
        zIndex={1000}
      >
        <Stack gap="xs">
          {NAV_LINKS.map((link) => (
            <HeaderNavLink
              key={link.path}
              link={link}
              isActive={location.pathname.startsWith(link.path)}
              onClick={closeDrawer}
            />
          ))}
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      {process.env.NODE_ENV === "development" && <PerformanceMetrics />}
    </AppShell>
  );
}
