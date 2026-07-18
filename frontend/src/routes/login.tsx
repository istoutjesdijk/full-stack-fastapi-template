import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  Link as RouterLink,
  redirect,
} from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  type Body_login_login_access_token as AccessToken,
  LoginService,
  OpenAPI,
} from "@/client"
import { AuthLayout } from "@/components/Common/AuthLayout"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { PasswordInput } from "@/components/ui/password-input"
import { APP_NAME } from "@/config"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

const formSchema = z.object({
  username: z.email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
}) satisfies z.ZodType<AccessToken>

type FormData = z.infer<typeof formSchema>

export const Route = createFileRoute("/login")({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
  head: () => ({
    meta: [
      {
        title: `Log In - ${APP_NAME}`,
      },
    ],
  }),
})

function Login() {
  const { loginMutation } = useAuth()
  // Determines which login options to show (password and/or SSO).
  const { data: config } = useQuery({
    queryKey: ["loginConfig"],
    queryFn: LoginService.loginConfig,
    staleTime: Number.POSITIVE_INFINITY,
  })
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return
    loginMutation.mutate(data)
  }

  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Login to your account</h1>
          </div>

          <div className="grid gap-4">
            {!config && (
              <div className="flex justify-center py-6">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {config?.password_login_enabled && (
              <>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="email-input"
                          placeholder="user@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                        <RouterLink
                          to="/recover-password"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </RouterLink>
                      </div>
                      <FormControl>
                        <PasswordInput
                          data-testid="password-input"
                          placeholder="Password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <LoadingButton type="submit" loading={loginMutation.isPending}>
                  Log In
                </LoadingButton>
              </>
            )}

            {config?.password_login_enabled && config?.sso_enabled && (
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background text-muted-foreground relative z-10 px-2">
                  or
                </span>
              </div>
            )}

            {config?.sso_enabled && (
              <Button
                type="button"
                variant="outline"
                data-testid="sso-button"
                onClick={() => {
                  window.location.href = `${OpenAPI.BASE}/api/v1/oauth/login`
                }}
              >
                Log in with SSO
              </Button>
            )}

            {config &&
              !config.password_login_enabled &&
              !config.sso_enabled && (
                <p className="text-center text-sm text-muted-foreground">
                  Logging in is currently disabled.
                </p>
              )}
          </div>

          {config?.signup_enabled && (
            <div className="text-center text-sm">
              Don't have an account yet?{" "}
              <RouterLink to="/signup" className="underline underline-offset-4">
                Sign up
              </RouterLink>
            </div>
          )}
        </form>
      </Form>
    </AuthLayout>
  )
}
